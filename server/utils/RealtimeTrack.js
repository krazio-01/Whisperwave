const onlineUsers = new Map();
const activeChats = new Map();

const updateOnlineUsers = (userId, socketId) => {
    onlineUsers.set(userId, socketId);
};

const removeOnlineUser = (socketIdParam) => {
    for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socketIdParam) {
            onlineUsers.delete(userId);
            return userId;
        }
    }
    return null;
};

module.exports = { onlineUsers, updateOnlineUsers, removeOnlineUser, activeChats };
