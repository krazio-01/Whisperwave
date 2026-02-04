const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoute = require('./routes/authRoutes');
const userRoute = require('./routes/userRoutes');
const messageRoute = require('./routes/messageRoutes');
const chatRoute = require('./routes/chatRoutes');

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8800;

// Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// View Engine
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'templates')]);

// API Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/chat', chatRoute);
app.use('/api/messages', messageRoute);

// Deployment Logic
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/build');
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => res.sendFile(path.join(clientBuildPath, 'index.html')));
} else {
    app.get('/', (req, res) => res.send('API is running successfully'));
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server started`);
});

// Socket.io Initialization
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,
    },
});

// Attach Socket Logic
socketHandler(io);
