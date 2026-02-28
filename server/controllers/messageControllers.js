const MessageBucket = require('../models/messageBucketModel');
const Chat = require('../models/chatModel');
const RedisService = require('../services/redisService');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../controllers/uploadController');
const { onlineUsers, activeChats } = require('../utils/RealtimeTrack');

const MESSAGE_KEY_PREFIX = 'messages:';
const MESSAGE_TTL_SECONDS = 86400; // 24 hours
const MAX_CACHED_MESSAGES = 40;

const fetchMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const targetBucketId = req.query.bucketId ? Number(req.query.bucketId) : null;
        const isInitialLoad = !targetBucketId;

        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;

        let readWatermarks = null;
        let cachedData = null;

        if (isInitialLoad) {
            const [updatedChat, cacheResult] = await Promise.all([
                Chat.findOneAndUpdate(
                    { _id: chatId },
                    {
                        $set: {
                            [`lastReadAt.${req.userId}`]: new Date(),
                            [`unseenMessageCounts.${req.userId}`]: 0,
                        },
                    },
                    { new: true, select: 'lastReadAt lastMessage' },
                ).lean(),
                RedisService.getListWithMeta(listKey, metaKey),
            ]);

            cachedData = cacheResult;

            if (updatedChat && updatedChat.lastReadAt) {
                readWatermarks = {};
                const latestMessageTime = updatedChat.lastMessage?.createdAt
                    ? new Date(updatedChat.lastMessage.createdAt).getTime()
                    : Date.now();

                Object.entries(updatedChat.lastReadAt).forEach(([memberId, readTime]) => {
                    const exactReadTime = new Date(readTime).getTime();
                    readWatermarks[memberId] = Math.min(exactReadTime, latestMessageTime);
                });
            }

            // cache-hit-check
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
            currentBucketId: oldestBucket?.bucketId || null,
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
                RedisService.saveListWithMeta(listKey, flatMessages, metaKey, metaData, MESSAGE_TTL_SECONDS).catch(
                    (err) => console.error('Redis cache set error:', err),
                );
            }
        }

        return res.json(responseData);
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const sendMessage = async (req, res) => {
    const { text, chatId } = req.body;
    const file = req.file;

    try {
        if (!chatId || (!text?.trim() && !file)) return res.status(400).send('Text and chatId are required');

        const [filename, chatMeta] = await Promise.all([
            file ? uploadImageToCloudinary(file, 'messages') : Promise.resolve(''),
            Chat.findById(chatId).select('members unseenMessageCounts lastReadAt').lean(),
        ]);

        if (!chatMeta) return res.status(404).send('Chat not found');

        const messageData = {
            sender: req.userId,
            text,
            image: filename,
            createdAt: new Date(),
        };

        let latestBucket = await MessageBucket.findOneAndUpdate(
            { chat: chatId, count: { $lt: 20 } },
            { $push: { messages: messageData }, $inc: { count: 1 } },
            { sort: { bucketId: -1 }, new: true },
        ).populate('messages.sender', 'username profilePicture');

        if (!latestBucket) {
            const maxBucket = await MessageBucket.findOne({ chat: chatId })
                .sort({ bucketId: -1 })
                .select('bucketId')
                .lean();

            latestBucket = await MessageBucket.create({
                chat: chatId,
                bucketId: maxBucket ? maxBucket.bucketId + 1 : 1,
                count: 1,
                messages: [messageData],
            });
            await latestBucket.populate('messages.sender', 'username profilePicture');
        }

        const messageResponse = latestBucket.messages[latestBucket.messages.length - 1].toObject();

        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;
        const cacheableMessage = { ...messageResponse };
        delete cacheableMessage.chat;

        // update message list using sliding-window
        RedisService.appendToListWithMeta(
            listKey,
            cacheableMessage,
            MAX_CACHED_MESSAGES,
            metaKey,
            MESSAGE_TTL_SECONDS,
        ).catch((err) => console.error('Redis append error:', err));

        const updatePayload = {
            $set: {
                lastMessage: {
                    text: messageResponse.text,
                    sender: messageResponse.sender,
                    createdAt: messageResponse.createdAt,
                },
                [`lastReadAt.${req.userId}`]: messageData.createdAt,
            },
            $inc: {},
        };

        // Update the unseenMessageCount and lastReadAt for the chat
        chatMeta.members.forEach((memberIdObj) => {
            const memberId = memberIdObj.toString();
            if (memberId !== req.userId) {
                // Check if the receiver has the sender's chat open
                const receiverSocketId = onlineUsers.get(memberId);
                const hasReceiverOpenedSenderChat = activeChats.get(receiverSocketId) === chatId;

                if (hasReceiverOpenedSenderChat) {
                    updatePayload.$set[`lastReadAt.${memberId}`] = messageData.createdAt;
                    updatePayload.$set[`unseenMessageCounts.${memberId}`] = 0;
                } else {
                    updatePayload.$inc[`unseenMessageCounts.${memberId}`] = 1;
                }
            }
        });

        if (Object.keys(updatePayload.$inc).length === 0) delete updatePayload.$inc;

        await Chat.updateOne({ _id: chatId }, updatePayload);

        res.json({
            success: true,
            message: messageResponse,
        });
    } catch (error) {
        console.error('sendMessage Error:', error);
        res.status(500).send('An error occurred while sending the message.');
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!messageId) return res.status(400).send('Invalid Request');

        const updatedBucket = await MessageBucket.findOneAndUpdate(
            { 'messages._id': messageId },
            {
                $pull: { messages: { _id: messageId } },
                $inc: { count: -1 },
            },
        ).lean();

        if (!updatedBucket) return res.status(404).json({ success: false, message: 'Message not found' });

        const targetMessage = updatedBucket.messages.find((m) => m._id.toString() === messageId);
        const chatId = updatedBucket.chat.toString();
        const messageTime = new Date(targetMessage.createdAt).getTime();

        if (targetMessage.image) {
            deleteImageFromCloudinary(targetMessage.image, 'messages').catch((err) =>
                console.error('Cloudinary delete error:', err),
            );
        }

        const chat = await Chat.findById(chatId).select('members lastReadAt unseenMessageCounts').lean();
        let newLastMessage = null;

        if (chat) {
            const updatePayload = { $set: {}, $inc: {} };

            // unseen count update
            chat.members.forEach((memberId) => {
                const mIdStr = memberId.toString();
                if (mIdStr !== req.userId) {
                    const userLastReadTime = chat.lastReadAt?.[mIdStr]
                        ? new Date(chat.lastReadAt[mIdStr]).getTime()
                        : 0;
                    if (messageTime > userLastReadTime && chat.unseenMessageCounts?.[mIdStr] > 0)
                        updatePayload.$inc[`unseenMessageCounts.${mIdStr}`] = -1;
                }
            });

            // re-calculation of last-message if needed
            const latestBucket = await MessageBucket.findOne({ chat: chatId, count: { $gt: 0 } })
                .sort({ bucketId: -1 })
                .populate('messages.sender', 'username profilePicture')
                .lean();

            if (latestBucket && latestBucket.messages.length > 0) {
                const lastMsg = latestBucket.messages[latestBucket.messages.length - 1];
                newLastMessage = {
                    text: lastMsg.text,
                    sender: lastMsg.sender,
                    createdAt: lastMsg.createdAt,
                };
            }

            updatePayload.$set.lastMessage = newLastMessage;
            if (Object.keys(updatePayload.$inc).length === 0) delete updatePayload.$inc;

            await Chat.updateOne({ _id: chatId }, updatePayload);
        }

        const listKey = `${MESSAGE_KEY_PREFIX}${chatId}`;
        const metaKey = `${MESSAGE_KEY_PREFIX}meta:${chatId}`;
        RedisService.removeMessage(listKey, metaKey, messageId, MESSAGE_TTL_SECONDS).catch((err) =>
            console.error('Redis delete error:', err),
        );

        return res.status(200).json({
            success: true,
            messageCreatedAt: targetMessage.createdAt,
            newLastMessage: newLastMessage,
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = { fetchMessages, sendMessage, deleteMessage };
