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

// fetch the users which are associated with loggedin user
const fetchAllAssociatedUsers = async (req, res) => {
    try {
        const currentUserId = req.userId;

        const chats = await Chat.find({ members: currentUserId }).select("members");

        const allMemberIds = chats.reduce((acc, chat) => {
            return acc.concat(chat.members);
        }, []);

        const uniqueMemberIds = [...new Set(allMemberIds.map(id => id.toString()))]
            .filter(id => id !== currentUserId);

        const associatedUsers = await User.find({ _id: { $in: uniqueMemberIds } })
            .select("_id username profilePicture email");

        res.status(200).json(associatedUsers);
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

module.exports = { searchUser, fetchAllAssociatedUsers };
