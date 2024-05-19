const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const cloudinary = require('../config/cloudinaryConfig');
const { uploadImageToCloudinary } = require('../controllers/uploadController');

const newChat = async (req, res) => {
    const { senderId, selectedReceiverId } = req.body;

    const isChatExist = await Chat.findOne({
        members: { $all: [senderId, selectedReceiverId] },
        isGroupChat: false,
    });

    if (isChatExist)
        return res.status(400).send("You are already part of this chat");

    const newChat = new Chat({
        chatName: "chat",
        isGroupChat: false,
        members: [senderId, selectedReceiverId],
    });

    try {
        const savedChat = await newChat.save();
        const FullChat = await Chat.findOne({ _id: savedChat._id }).populate(
            "members",
            "-password"
        );
        res.status(200).json(FullChat);
    }
    catch (err) {
        res.status(500).send("Internal Server Error");
    }
};

const fetchChats = async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch all the chats for the user
        const chats = await Chat.find({ members: userId })
            .populate("members", "-password")
            .populate("groupAdmin", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        const populatedChats = await User.populate(chats, {
            path: "lastMessage.sender",
            select: "username email profilePicture",
        });

        // Fetch the unseen message counts for the user's chats
        const unseenMessageCounts = {};
        for (const chat of populatedChats) {
            const chatId = chat._id.toString();
            const count = chat.unseenMessageCounts.get(userId.toString()) || 0;
            unseenMessageCounts[chatId] = count;
        }

        res.json({ chats: populatedChats, unseenMessageCounts });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

const deleteChat = async (req, res) => {
    const { chatId } = req.body;

    try {
        const chat = await Chat.findOne({
            _id: chatId,
            members: { $in: [req.userId] }
        });

        if (!chat)
            return res.status(404).json({ message: "Chat not found or you are not a member of this chat." });

        if (chat.isGroupChat) {
            if (chat.groupAdmin.toString() === req.userId) {
                const remainingMembers = chat.members.filter(member => member.toString() !== req.userId);
                if (remainingMembers.length > 0) {
                    const newAdminIndex = Math.floor(Math.random() * remainingMembers.length);
                    const newAdminId = remainingMembers[newAdminIndex].toString();
                    chat.groupAdmin = newAdminId;
                    await chat.save();
                }
            }

            await Chat.findByIdAndUpdate(
                chatId, { $pull: { members: req.userId } }
            );
        }
        else {
            const otherUserId = chat.members.find(member => member.toString() !== req.userId);
            await Chat.deleteMany({
                $or: [
                    { members: [req.userId, otherUserId] },
                    { members: [otherUserId, req.userId] }
                ]
            });
        }

        // find and delete images in chat as well
        const messagesWithImages = await Message.find({ chat: chatId, image: { $exists: true, $ne: '' } });
        const imageUrls = messagesWithImages.map(message => message.image);

        await Promise.all(imageUrls.map(async imageUrl => {
            const Id = imageUrl.split('/').pop().split('.')[0];
            const publicId = `whisperwave/messages/${Id}`;
            await cloudinary.uploader.destroy(publicId);
        }));

        // delete messages from database
        await Message.deleteMany({ chat: chatId });
        res.status(200).json({ message: "Chat and messages deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const createGroupChat = async (req, res) => {
    if (!req.body.members || !req.body.name)
        return res.status(400).send({ message: "Please Fill all the feilds" });

    var users = JSON.parse(req.body.members);

    if (users.length < 2)
        return res.status(400).send("More than 2 users are required to form a group chat");

    // add the currently logged in user also
    users.push(req.userId);

    try {
        let imageUrl;
        if (req.file)
            imageUrl = await uploadImageToCloudinary(req.file, 'chats');
        else
            imageUrl = 'https://res.cloudinary.com/krazio/image/upload/v1691853992/whisperwave/chats/noGroupProfile_mxvoxd.png';

        const groupChat = new Chat({
            chatName: req.body.name,
            members: users,
            isGroupChat: true,
            groupAdmin: req.userId,
            groupProfilePic: imageUrl,
        });

        await groupChat.save();

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("members", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

const renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;

    try {
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName: chatName,
            },
            {
                new: true,
            }
        )
            .populate("members", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat)
            res.status(404).send("Chat Not Found");
        else
            res.json(updatedChat);
    }
    catch (error) {
        res.status(400).send(error.message);
    }

};

const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findOne({ _id: chatId });
        const otherMembers = chat.members.filter(member => member.toString() !== req.userId);

        if (otherMembers.length === 1)
            return res.status(404).send("Group chat cannote be less than 2 members");

        // check if the requester is admin
        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { members: userId },
            },
            {
                new: true,
            }
        )
            .populate("members", "-password")
            .populate("groupAdmin", "-password");

        if (!removed)
            res.status(404).send("Chat Not Found");
        else
            res.json(removed);
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        // check if the requester is admin
        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { members: userId },
            },
            {
                new: true,
            }
        )
            .populate("members", "-password")
            .populate("groupAdmin", "-password");

        if (!added)
            res.status(404).send("Chat Not Found");
        else
            res.json(added);
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

module.exports = { newChat, fetchChats, deleteChat, createGroupChat, renameGroup, removeFromGroup, addToGroup };
