const MessageBucket = require('../models/messageBucketModel');
const Chat = require('../models/chatModel');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const { onlineUsers, activeChats } = require('../utils/RealtimeTrack');
const redisClient = require('../config/redis');

const fetchMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const targetBucketId = req.query.bucketId ? Number(req.query.bucketId) : null;

        const cacheKey = `messages:${chatId}`;

        if (!targetBucketId) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                Chat.findByIdAndUpdate(chatId, { [`unseenMessageCounts.${req.userId}`]: 0 }).exec();
                return res.json(JSON.parse(cachedData));
            }
        }

        let query = { chat: chatId };
        let fetchLimit = 1;

        if (targetBucketId) query.bucketId = targetBucketId;
        else fetchLimit = 2;

        const buckets = await MessageBucket.find(query)
            .sort({ bucketId: -1 })
            .limit(fetchLimit)
            .populate('messages.sender', 'username profilePicture');

        if (!targetBucketId) await Chat.findByIdAndUpdate(chatId, { [`unseenMessageCounts.${req.userId}`]: 0 });

        let flatMessages = [];
        for (const bucket of buckets) flatMessages.push(...bucket.messages);

        const oldestBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;

        const responseData = {
            messages: flatMessages.reverse(),
            currentBucketId: oldestBucket ? oldestBucket.bucketId : null,
            hasMore: oldestBucket ? oldestBucket.bucketId > 1 : false,
        };

        if (!targetBucketId) await redisClient.setEx(cacheKey, 86400, JSON.stringify(responseData));

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

// create new message
const sendMessage = async (req, res) => {
    const { text, chatId } = req.body;

    try {
        if (!text || !chatId) return res.sendStatus(400);

        // image upload
        let filename = '';
        if (req.file) filename = await uploadImageToCloudinary(req.file, 'messages');

        const messageData = {
            sender: req.userId,
            text: text || '',
            image: filename,
            createdAt: new Date(),
        };

        let latestBucket = await MessageBucket.findOne({ chat: chatId }).sort({ bucketId: -1 });

        if (!latestBucket || latestBucket.messages.length >= 20) {
            const newBucketId = latestBucket ? latestBucket.bucketId + 1 : 1;
            latestBucket = await MessageBucket.create({
                chat: chatId,
                bucketId: newBucketId,
                count: 1,
                messages: [messageData],
            });
            await latestBucket.save();
        } else {
            latestBucket.messages.push(messageData);
            latestBucket.count += 1;
            await latestBucket.save();
        }

        await latestBucket.populate('messages.sender', 'username profilePicture');
        const messageResponse = latestBucket.messages[latestBucket.messages.length - 1].toObject();

        try {
            const cacheKey = `messages:${chatId}`;
            const cachedDataString = await redisClient.get(cacheKey);

            if (cachedDataString) {
                const cachedData = JSON.parse(cachedDataString);
                cachedData.messages.push(messageResponse);

                if (cachedData.messages.length > 40) cachedData.messages.shift();

                await redisClient.setEx(cacheKey, 86400, JSON.stringify(cachedData));
            }
        } catch (redisError) {
            console.error('Redis Cache Update Failed:', redisError);
        }

        const populatedChat = await Chat.findById(chatId).populate('members', 'username email profilePicture');
        messageResponse.chat = populatedChat;

        const leanLastMessage = {
            text: messageResponse.text,
            sender: messageResponse.sender,
            createdAt: messageResponse.createdAt,
        };

        await Chat.findByIdAndUpdate(chatId, { lastMessage: leanLastMessage });

        // Update the unseenMessageCount for the chat
        if (populatedChat) {
            populatedChat.members.forEach(async (member) => {
                const memberId = member._id.toString();
                const senderId = messageResponse.sender._id.toString();

                if (memberId !== senderId) {
                    const receiverSocketId = onlineUsers.get(memberId);

                    // Check if the receiver has the sender's chat open
                    const receiverOpenedChatId = activeChats.get(receiverSocketId);
                    const hasReceiverOpenedSenderChat = receiverOpenedChatId === chatId;

                    if (!hasReceiverOpenedSenderChat) {
                        populatedChat.unseenMessageCounts.set(
                            memberId,
                            (populatedChat.unseenMessageCounts.get(memberId) || 0) + 1,
                        );
                    }
                }
            });

            await populatedChat.save();
        }

        res.json(messageResponse);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

module.exports = { fetchMessages, sendMessage };
