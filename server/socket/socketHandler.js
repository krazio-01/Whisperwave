const { onlineUsers, updateOnlineUsers, activeChats } = require('../utils/RealtimeTrack');

const socketHandler = (io) => {
    io.on('connection', (socket) => {

        // --- User Setup ---
        socket.on('user:setup', (userId) => {
            socket.join(userId);
            socket.emit('user:connected');
            updateOnlineUsers(userId, socket.id);
            io.emit('user:online-list', onlineUsers.map((user) => user.userId));
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
                status: data.status
            });
        });

        socket.on('call:end', (data) => {
            if (data.to) socket.to(data.to).emit('call:ended');
        });

        // --- Disconnect ---
        socket.on('disconnect', () => {
            const userIndex = onlineUsers.findIndex((user) => user.socketId === socket.id);
            if (userIndex !== -1) {
                onlineUsers.splice(userIndex, 1);
                io.emit('user:online-list', onlineUsers.map((user) => user.userId));
            }
            activeChats.delete(socket.id);
        });
    });
};

module.exports = socketHandler;
