const MessageBucket = require('../models/messageBucketModel');
const Chat = require('../models/chatModel');
const RedisService = require('../services/redisService');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../controllers/uploadController');
const { onlineUsers, activeChats } = require('../utils/RealtimeTrack');

const MESSAGE_KEY_PREFIX = 'messages:';
const MESSAGE_TTL_SECONDS = 86400; // 24 hours
const MAX_CACHED_MESSAGES = 40;

// fetch messages
const fetchMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const targetBucketId = req.query.bucketId ? Number(req.query.bucketId) : null;
        const isInitialLoad = !targetBucketId;

        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;

        let readWatermarks = null;

        if (isInitialLoad) {
            const updatedChat = await Chat.findOneAndUpdate(
                { _id: chatId },
                {
                    $set: {
                        [`lastReadAt.${req.userId}`]: new Date(),
                        [`unseenMessageCounts.${req.userId}`]: 0,
                    },
                },
                { new: true, select: 'lastReadAt lastMessage' },
            ).lean();

            if (updatedChat && updatedChat.lastReadAt) {
                readWatermarks = {};
                const latestMessageTime = updatedChat.lastMessage
                    ? new Date(updatedChat.lastMessage.createdAt).getTime()
                    : Date.now();

                Object.keys(updatedChat.lastReadAt).forEach((memberId) => {
                    const exactReadTime = new Date(updatedChat.lastReadAt[memberId]).getTime();
                    readWatermarks[memberId] = exactReadTime > latestMessageTime ? latestMessageTime : exactReadTime;
                });
            }

            // 2. cache-hit-check
            const cachedData = await RedisService.getListWithMeta(listKey, metaKey);
            if (cachedData) {
                return res.json({
                    messages: cachedData.list,
                    currentBucketId: cachedData.meta.currentBucketId,
                    hasMore: cachedData.meta.hasMore,
                    readWatermarks,
                });
            }
        }

        const query = { chat: chatId };
        if (targetBucketId) query.bucketId = targetBucketId;

        const buckets = await MessageBucket.find(query)
            .sort({ bucketId: -1 })
            .limit(isInitialLoad ? 2 : 1)
            .populate('messages.sender', 'username profilePicture')
            .lean();

        const flatMessages = buckets.flatMap((bucket) => bucket.messages).reverse();
        const oldestBucket = buckets[buckets.length - 1];

        const responseData = {
            messages: flatMessages,
            currentBucketId: oldestBucket ? oldestBucket.bucketId : null,
            hasMore: oldestBucket ? oldestBucket.bucketId > 1 : false,
        };

        if (isInitialLoad) {
            responseData.readWatermarks = readWatermarks;

            // cache-miss-set
            if (flatMessages.length > 0) {
                const metaData = {
                    currentBucketId: responseData.currentBucketId,
                    hasMore: responseData.hasMore,
                };
                RedisService.saveListWithMeta(listKey, flatMessages, metaKey, metaData, MESSAGE_TTL_SECONDS);
            }
        }

        return res.json(responseData);
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// create new message
const sendMessage = async (req, res) => {
    const { text, chatId } = req.body;

    try {
        if (!text || !chatId) return res.status(400).send('Text and chatId are required');

        const filename = req.file ? await uploadImageToCloudinary(req.file, 'messages') : '';

        const messageData = {
            sender: req.userId,
            text,
            image: filename,
            createdAt: new Date(),
        };

        let latestBucket = await MessageBucket.findOne({ chat: chatId }).sort({ bucketId: -1 });

        if (!latestBucket || latestBucket.messages.length >= 20) {
            latestBucket = await MessageBucket.create({
                chat: chatId,
                bucketId: latestBucket ? latestBucket.bucketId + 1 : 1,
                count: 1,
                messages: [messageData],
            });
        } else {
            latestBucket.messages.push(messageData);
            latestBucket.count += 1;
            await latestBucket.save();
        }

        await latestBucket.populate('messages.sender', 'username profilePicture');
        const messageResponse = latestBucket.messages[latestBucket.messages.length - 1].toObject();

        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;
        const cacheableMessage = { ...messageResponse };
        delete cacheableMessage.chat;

        // update message list using sliding-window
        RedisService.appendToListWithMeta(listKey, cacheableMessage, MAX_CACHED_MESSAGES, metaKey, MESSAGE_TTL_SECONDS);

        const populatedChat = await Chat.findById(chatId).populate('members', 'username email profilePicture');
        if (!populatedChat) return res.status(404).send('Chat not found');

        messageResponse.chat = populatedChat;
        populatedChat.lastMessage = {
            text: messageResponse.text,
            sender: messageResponse.sender,
            createdAt: messageResponse.createdAt,
        };

        const messageTime = messageData.createdAt;
        if (!populatedChat.lastReadAt) populatedChat.lastReadAt = new Map();
        populatedChat.lastReadAt.set(req.userId, messageData.createdAt);

        // Update the unseenMessageCount for the chat
        populatedChat.members.forEach((member) => {
            const memberId = member._id.toString();
            const senderId = messageResponse.sender._id.toString();

            if (memberId !== senderId) {
                // Check if the receiver has the sender's chat open
                const receiverSocketId = onlineUsers.get(memberId);
                const hasReceiverOpenedSenderChat = activeChats.get(receiverSocketId) === chatId;

                if (!hasReceiverOpenedSenderChat) {
                    populatedChat.lastReadAt.set(memberId, messageTime);
                    if (!populatedChat.unseenMessageCounts) populatedChat.unseenMessageCounts = new Map();
                    populatedChat.unseenMessageCounts.set(memberId, 0);
                } else {
                    const currentCount = populatedChat.unseenMessageCounts?.get(memberId) || 0;
                    if (!populatedChat.unseenMessageCounts) populatedChat.unseenMessageCounts = new Map();
                    populatedChat.unseenMessageCounts.set(memberId, currentCount + 1);
                }
            }
        });

        await populatedChat.save();
        res.json(messageResponse);
    } catch (error) {
        console.error('sendMessage Error:', error);
        res.status(500).send('An error occurred while sending the message.');
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const bucket = await MessageBucket.findOne({ 'messages._id': messageId }, { 'messages.$': 1, chat: 1 }).lean();

        if (!bucket || !bucket.messages || bucket.messages.length === 0)
            return res.status(404).json({ success: false, message: 'Message not found' });

        const targetMessage = bucket.messages[0];
        const chatId = bucket.chat.toString();
        const messageTime = new Date(targetMessage.createdAt).getTime();

        if (targetMessage.image && targetMessage.image !== '')
            await deleteImageFromCloudinary(targetMessage.image, 'messages');

        const updatedBucket = await MessageBucket.findOneAndUpdate(
            { 'messages._id': messageId },
            {
                $pull: { messages: { _id: messageId } },
                $inc: { count: -1 },
            },
            { new: true },
        );

        if (!updatedBucket) return res.status(400).json({ success: false, message: 'Failed to update database' });

        const chat = await Chat.findById(chatId);
        if (chat) {
            // Check timestamps to accurately decrement unseen counts
            chat.members.forEach((memberId) => {
                const mIdStr = memberId.toString();
                if (mIdStr !== req.userId) {
                    const userLastReadTimeStr = chat.lastReadAt?.get(mIdStr);
                    const userLastReadTime = userLastReadTimeStr ? new Date(userLastReadTimeStr).getTime() : 0;

                    if (messageTime > userLastReadTime) {
                        const currentCount = chat.unseenMessageCounts?.get(mIdStr) || 0;
                        if (currentCount > 0) chat.unseenMessageCounts.set(mIdStr, currentCount - 1);
                    }
                }
            });

            const latestBucket = await MessageBucket.findOne({ chat: chatId, 'messages.0': { $exists: true } })
                .sort({ bucketId: -1 })
                .populate('messages.sender', 'username profilePicture');

            if (latestBucket && latestBucket.messages.length > 0) {
                const lastMsg = latestBucket.messages[latestBucket.messages.length - 1];
                chat.lastMessage = {
                    text: lastMsg.text,
                    sender: lastMsg.sender,
                    createdAt: lastMsg.createdAt,
                };
            } else {
                chat.lastMessage = null;
            }

            await chat.save();
        }

        // 4. Update Redis Cache
        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;
        await RedisService.removeMessage(listKey, metaKey, messageId, MESSAGE_TTL_SECONDS);

        return res.status(200).json({
            success: true,
            messageCreatedAt: targetMessage.createdAt,
            newLastMessage: chat.lastMessage,
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = { fetchMessages, sendMessage, deleteMessage };
