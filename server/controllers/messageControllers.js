const MessageBucket = require('../models/messageBucketModel');
const Chat = require('../models/chatModel');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const { onlineUsers, activeChats } = require('../utils/RealtimeTrack');

// getting all messages
const fetchMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const targetBucketId = req.query.bucketId ? Number(req.query.bucketId) : null;

        let query = { chat: chatId };
        let fetchLimit = 1;

        if (targetBucketId) query.bucketId = targetBucketId;
        else fetchLimit = 2;

        const buckets = await MessageBucket.find(query)
            .sort({ bucketId: -1 })
            .limit(fetchLimit)
            .populate('messages.sender', 'username profilePicture');

        if (!targetBucketId) {
            const chat = await Chat.findById(chatId);
            if (chat) {
                chat.unseenMessageCounts.set(req.userId.toString(), 0);
                await chat.save();
            }
        }

        let flatMessages = [];
        for (const bucket of buckets) flatMessages.push(...bucket.messages);

        const oldestBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;

        res.json({
            messages: flatMessages,
            currentBucketId: oldestBucket ? oldestBucket.bucketId : null,
            hasMore: oldestBucket ? oldestBucket.bucketId > 1 : false,
        });
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
