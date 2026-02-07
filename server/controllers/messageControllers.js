const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const { onlineUsers, activeChats } = require('../utils/RealtimeTrack');

// getting all messages
const fetchMessages = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'username profilePicture')
            .select('-__v -updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalMessages = await Message.countDocuments({ chat: req.params.chatId });

        if (page === 1) {
            const chat = await Chat.findById(req.params.chatId);
            if (chat) {
                chat.unseenMessageCounts.set(req.userId.toString(), 0);
                await chat.save();
            }
        }

        res.json({
            messages: messages.reverse(),
            hasMore: totalMessages > skip + messages.length,
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

async function createMessageAndSendResponse(newMessage, chatId, res) {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'username profilePicture');
    message = await message.populate('chat');
    message = await User.populate(message, {
        path: 'chat.members',
        select: 'username email profilePicture',
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

    // Update the unseenMessageCount for the chat
    const chat = await Chat.findById(chatId);

    if (chat) {
        chat.members.forEach(async (member) => {
            const memberId = member.toString();
            if (memberId !== newMessage.sender.toString()) {
                const receiverSocketId = onlineUsers.find((user) => user.userId.toString() === memberId)?.socketId;

                // Check if the receiver has the sender's chat open
                const receiverOpenedChatId = activeChats.get(receiverSocketId);
                const hasReceiverOpenedSenderChat = receiverOpenedChatId === chatId;

                if (!hasReceiverOpenedSenderChat)
                    chat.unseenMessageCounts.set(
                        member.toString(),
                        (chat.unseenMessageCounts.get(member.toString()) || 0) + 1,
                    );
            }
        });

        await chat.save();
    }

    res.json(message);
}

// create new message
const sendMessage = async (req, res) => {
    const { text, chatId } = req.body;

    try {
        if (req.file) {
            // image upload
            const filename = await uploadImageToCloudinary(req.file, 'messages');
            var newMessage = {
                sender: req.userId,
                text: text,
                chat: chatId,
                image: filename,
            };
            await createMessageAndSendResponse(newMessage, chatId, res);
        } else {
            if (!text || !chatId) {
                console.log('Invalid data passed into request');
                return res.sendStatus(400);
            }
            var newMessage = {
                sender: req.userId,
                text: text,
                chat: chatId,
            };
            await createMessageAndSendResponse(newMessage, chatId, res);
        }
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
};

module.exports = { fetchMessages, sendMessage };
