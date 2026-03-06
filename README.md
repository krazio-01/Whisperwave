# Whisperwave

Whisperwave is a feature-rich chatting application built using the MERN stack (MongoDB, Express.js, React, and Node.js) and WebSockets through socket.io for real-time communication. This application allows users to connect with friends, family, and colleagues, providing a seamless chatting experience with various advanced features.

## Live Demo 🚀

Check out the live demo of Whisperwave [here](https://whisperwave.onrender.com/).

## Features

- **Real-time Messaging:** Instant messaging with real-time updates using Socket.io, complete with message deletion and unread message badges.
- **End-to-End Encryption:** Private one-on-one chats stay completely private.
- **Voice & Video Calls:** Built using WebRTC for peer-to-peer media connections.
- **Redis Caching:** Faster message retrieval and reduced load on the MongoDB database.
- **Read Receipts:** See exactly who has read your messages in both private and group chats.
- **Live Typing Indicators:** See exactly when someone is typing a reply.
- **Group Chats:** Create groups, auto-assign admins, rename chats, and seamlessly add or remove members.
- **Image Sharing:** Send images directly within your conversations.
- **Profile Management:** Customize your avatar and user information.
- **Responsive UI:** Works smoothly on both desktop and mobile screens.

## Under the Hood

### Dynamic Chat Encryption
To keep conversations secure, Whisperwave uses AES encryption via `crypto-js`. Instead of relying on a single global secret to encrypt all messages across the database, the app generates a **dynamic, chat-specific key** on the fly using HMAC-SHA256 (`HMAC(chatId, masterSecret)`). This ensures every conversation is encrypted with its own unique derivative key, preventing cross-chat vulnerabilities and keeping your data locked down.

### Redis Sliding Window Cache
Fetching chat history directly from MongoDB every time a user opens a conversation can be slow and expensive. To fix this, Whisperwave uses a **sliding window cache** pattern powered by Redis Lists. 

When a chat is active, the most recent messages are kept in a Redis list. As new messages are sent, they are pushed into the list, and older messages are popped off to keep the list at a fixed size (the "sliding window"). This means opening a chat feels instant because the data comes straight from RAM. MongoDB is only queried when a user explicitly scrolls up to load older chat history.

## Technologies Used

- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database & Caching:** MongoDB, Redis
- **Real-time & Media:** Socket.io, WebRTC
- **Auth & Security:** JWT, bcrypt

## Running it locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/krazio-01/Whisperwave.git
   cd Whisperwave

2. **Install dependencies**
   ```bash
   cd client
   npm install
   cd ../server
   npm install

3. **Set up environment variables**
   set up environment variables using ".env copy" file by renaming it to ".env" and fill in your actual keys (like your MongoDB URI, Redis URL, and JWT secret).

4. **Start the application**
   1. Terminal for Backend
      ```bash
      cd server
      npm run dev
    2. Terminal for frontend
       ```bash
       cd client
       npm start

5. **Access Application at this url**
Open your browser and navigate to http://localhost:3000.

## Usage
1. Register: Create a new account by providing a username, email, and password.
2. Login: Access your account with your credentials.
3. Start Chatting: Begin a new conversation by searching for users with their **username** or creating a group chat.
4. Send Messages: Enjoy real-time messaging with instant notifications and file sharing capabilities.

## Contributions
Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to follow the coding guidelines and include relevant tests.

## Contact
For any questions or inquiries, please contact md.krazio@gmail.com.
