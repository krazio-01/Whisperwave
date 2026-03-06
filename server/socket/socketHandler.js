const { onlineUsers, updateOnlineUsers, removeOnlineUser, activeChats } = require('../utils/RealtimeTrack');

const extractId = (entity) => (entity && entity._id ? entity._id.toString() : entity?.toString());

const getRecipients = (members, ...exclusions) => {
    if (!members || !Array.isArray(members)) return [];
    return members
        .map(extractId)
        .filter((id) => id && !exclusions.includes(id));
};

const socketHandler = (io) => {
    const getOnlineUsersObj = () => Object.fromEntries(onlineUsers);

    io.on('connection', (socket) => {
        // --- User Setup ---
        socket.on('user:setup', (userId) => {
            const uid = extractId(userId);
            socket.join(uid);
            socket.emit('user:connected');
            updateOnlineUsers(uid, socket.id);
            io.emit('user:online-list', getOnlineUsersObj());
        });

        // --- Chat Logic ---
        socket.on('chat:join', (room) => {
            const roomId = extractId(room);
            socket.join(roomId);
            activeChats.set(socket.id, roomId);
        });

        socket.on('chat:leave', (room) => {
            const roomId = extractId(room);
            socket.leave(roomId);
            activeChats.delete(socket.id);
        });

        socket.on('chat:new', (newChatData) => {
            if (!newChatData?.members) return;

            const senderId = extractId(newChatData.isGroupChat ? newChatData.groupAdmin : newChatData.members[0]);
            const recipients = getRecipients(newChatData.members, senderId, socket.id);

            if (recipients.length > 0) socket.to(recipients).emit('chat:new-received', newChatData);
        });

        socket.on('chat:deleted', ({ chatId, members, senderId }) => {
            const sid = extractId(senderId);
            const recipients = getRecipients(members, sid, socket.id);

            if (recipients.length > 0) socket.to(recipients).emit('chat:removed', { chatId });
        });

        socket.on('chat:send-message', (newMessageReceived) => {
            const senderId = extractId(newMessageReceived?.sender);
            const recipients = getRecipients(newMessageReceived?.members, senderId);

            if (recipients.length > 0) socket.to(recipients).emit('chat:message-received', newMessageReceived);
        });

        socket.on('chat:message-deleted', (payload) => {
            const { members, ...eventData } = payload;
            const recipients = getRecipients(members, socket.id);

            if (recipients.length > 0) socket.to(recipients).emit('chat:message-deleted', eventData);
        });

        socket.on('chat:mark-read', ({ chatId, userId, timestamp }) => {
            socket.to(extractId(chatId)).emit('chat:message-read', { chatId, userId, timestamp });
        });

        // --- Typing Logic ---
        const handleTyping = (event, data) => {
            const { chatId, userId, members } = data;
            const uid = extractId(userId);

            if (members && members.length > 0) {
                const recipients = getRecipients(members, uid, socket.id);
                if (recipients.length > 0) socket.to(recipients).emit(event, { chatId, userId: uid });
            } else {
                socket.to(extractId(chatId)).emit(event, { chatId, userId: uid });
            }
        };

        socket.on('typing:start', (data) => handleTyping('typing:start', data));
        socket.on('typing:stop', (data) => handleTyping('typing:stop', data));

        // --- Call Logic ---
        socket.on('call:offer', (data) => {
            socket.to(extractId(data.to)).emit('call:offer', {
                from: socket.handshake.auth.userId || data.from,
                offer: data.offer,
                callType: data.callType,
                callerName: data.callerName,
                callerPic: data.callerPic,
            });
        });

        socket.on('call:answer', (data) => {
            socket.to(extractId(data.to)).emit('call:answer', { from: socket.id, answer: data.answer });
        });

        socket.on('call:ice-candidate', (data) => {
            socket.to(extractId(data.to)).emit('call:ice-candidate', { from: socket.id, candidate: data.candidate });
        });

        socket.on('call:toggle-media', (data) => {
            socket.to(extractId(data.to)).emit('call:toggle-media', { type: data.type, status: data.status });
        });

        socket.on('call:end', (data) => {
            if (data.to) socket.to(extractId(data.to)).emit('call:ended');
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
