let onlineUsers = [];

const activeChats = new Map();

const updateOnlineUsers = (userId, socketId) => {
    const existingUserIndex = onlineUsers.findIndex(user => user.userId === userId);

    if (existingUserIndex !== -1)
        onlineUsers[existingUserIndex].socketId = socketId;
    else
        onlineUsers.push({ userId, socketId });
};

module.exports = { onlineUsers, updateOnlineUsers, activeChats };
