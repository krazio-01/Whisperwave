const User = require('../models/userModel');
const Chat = require('../models/chatModel');

// seach a user
const searchUser = async (req, res) => {
    const { username, loggedUser } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user && (username !== loggedUser.username))
            res.json(user);
        else
            res.status(404).json({ message: 'User not found' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// /api/users?search=farhat
const allUsers = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { username: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            }
            : {};

        const userChats = await Chat.find({ members: { $elemMatch: { $eq: req.userId } } });
        const userIDs = userChats.reduce((ids, chat) => {
            if (!chat.isGroupChat && chat.members.length === 2) {
                const otherMember = chat.members.find(memberId => memberId.toString() !== req.userId);
                if (otherMember) ids.push(otherMember);
            }
            return ids;
        }, []);

        const users = await User.find({
            $and: [
                keyword,
                { _id: { $ne: req.userId } },
                { _id: { $in: userIDs } },
            ],
        });

        res.send(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { allUsers, searchUser };