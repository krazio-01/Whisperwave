const { onlineUsers, updateOnlineUsers, removeOnlineUser, activeChats } = require('../utils/RealtimeTrack');

const socketHandler = (io) => {
    const getOnlineUsersObj = () => Object.fromEntries(onlineUsers);

    io.on('connection', (socket) => {
        // --- User Setup ---
        socket.on('user:setup', (userId) => {
            socket.join(userId);
            socket.emit('user:connected');
            updateOnlineUsers(userId, socket.id);
            io.emit('user:online-list', getOnlineUsersObj());
        });

        // --- Chat Logic ---
        socket.on('chat:join', (room) => {
            socket.join(room);
            activeChats.set(socket.id, room);
        });

        socket.on('chat:leave', (room) => {
            socket.leave(room);
            activeChats.delete(socket.id);
        });

        socket.on('chat:send-message', (newMessageReceived) => {
            const chat = newMessageReceived.chat;
            if (!chat.members) return;

            chat.members.forEach((user) => {
                if (user._id === newMessageReceived.sender._id) return;
                socket.in(user._id).emit('chat:message-received', newMessageReceived);
            });
        });

        // --- typing Logic ---
        socket.on('typing:start', (data) => {
            const { chatId, userId } = data;
            socket.to(chatId).emit('typing:start', { chatId, userId });
        });

        socket.on('typing:stop', (data) => {
            const { chatId, userId } = data;
            socket.to(chatId).emit('typing:stop', { chatId, userId });
        });

        // --- Call Logic ---
        socket.on('call:offer', (data) => {
            socket.to(data.to).emit('call:offer', {
                from: socket.handshake.auth.userId || data.from,
                offer: data.offer,
                callType: data.callType,
                callerName: data.callerName,
                callerPic: data.callerPic,
            });
        });

        socket.on('call:answer', (data) => {
            socket.to(data.to).emit('call:answer', {
                from: socket.id,
                answer: data.answer,
            });
        });

        socket.on('call:ice-candidate', (data) => {
            socket.to(data.to).emit('call:ice-candidate', {
                from: socket.id,
                candidate: data.candidate,
            });
        });

        socket.on('call:toggle-media', (data) => {
            socket.to(data.to).emit('call:toggle-media', {
                type: data.type,
                status: data.status,
            });
        });

        socket.on('call:end', (data) => {
            if (data.to) socket.to(data.to).emit('call:ended');
        });

        // --- Disconnect ---
        socket.on('disconnect', () => {
            const removedUserId = removeOnlineUser(socket.id);
            if (removedUserId) io.emit('user:online-list', getOnlineUsersObj());
            activeChats.delete(socket.id);
        });
    });
};

module.exports = socketHandler;
