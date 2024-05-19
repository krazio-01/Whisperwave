const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require('cors');
const dotenv = require("dotenv");
const authRoute = require("./routes/authRoutes");
const userRoute = require('./routes/userRoutes');
const messageRoute = require("./routes/messageRoutes");
const chatRoute = require("./routes/chatRoutes");
const { onlineUsers, updateOnlineUsers, activeChats } = require('./utils/RealtimeTrack');
const path = require("path");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();
const Port = process.env.PORT || 8800;

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log("Error while connecting to DB", err);
});

// cors
app.use(cors({
    origin: `${process.env.FRONTEND_URL}`
}));

//middleware
app.use(express.json());
app.set('view engine', 'ejs');

// adding route path
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use('/api/chat', chatRoute);
app.use('/api/messages', messageRoute);

// --------------------------Deployment----------------------------

app.use(express.static(path.join(__dirname, '/client/build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

// --------------------------Deployment---------------------------- 

// for handling errors
app.use(notFound);
app.use(errorHandler);

const server = app.listen(Port, () => {
    console.log("App started");
});

// socket.io implementation
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: `${process.env.FRONTEND_URL}`
    }
});

io.on('connection', (socket) => {
    // fetching userId and socketId from user
    socket.on('setup', (userId) => {
        socket.join(userId);
        socket.emit('connected');
        updateOnlineUsers(userId, socket.id);
        io.emit('onlineUsers', onlineUsers.map(user => user.userId));
    });

    // send and get message
    socket.on("joinChat", (room) => {
        socket.join(room);
        activeChats.set(socket.id, room);
    });

    socket.on("sendMessage", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.members)
            return;

        chat.members.forEach(user => {
            if (user._id == newMessageRecieved.sender._id) {
                socket.emit("messageRecieved", newMessageRecieved);
                return;
            }
            socket.in(user._id).emit("messageRecieved", newMessageRecieved);
        });
    });

    socket.on('disconnect', () => {
        const userIndex = onlineUsers.findIndex(user => user.socketId === socket.id);
        if (userIndex !== -1) {
            const userId = onlineUsers[userIndex].userId;
            onlineUsers.splice(userIndex, 1);
            io.emit('onlineUsers', onlineUsers.map(user => user.userId));
        }
        activeChats.delete(socket.id);
    });
});