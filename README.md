# Whisperwave

Whisperwave is a real-time chat application built with the MERN stack. It goes beyond basic messaging by offering advanced features like chat-specific encryption for privacy, WebRTC for seamless voice and video calls, and Redis caching for incredibly fast message retrieval.

## Live Demo 🚀

Check out the live demo of Whisperwave [here](https://whisperwave.onrender.com/).

<div align="center">
  <img src="https://github.com/user-attachments/assets/b98f838d-96ae-4898-8f6e-c5d082ccc513" width="49%" alt="Whisperwave Secondary View" />
  <img src="https://github.com/user-attachments/assets/1926b07d-c4b4-44ac-9483-b238bfd41c0d" width="49%" alt="Whisperwave Main Chat Interface" />
</div>

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

## Screenshots

<div align="center">
  <table border="0" align="center">
    <tr>
      <td align="center" valign="middle">
        <img src="https://github.com/user-attachments/assets/f310acfb-00e6-4c88-8803-6106321c1142" width="160" alt="Mobile List" />
      </td>
      <td align="center" valign="middle">
        <img src="https://github.com/user-attachments/assets/b988b618-7cc5-42d6-ad53-110afda1a0e5" width="160" alt="Mobile Chat" />
      </td>
      <td align="center" valign="middle">
        <img src="https://github.com/user-attachments/assets/802f3b51-ffd6-4893-9cca-e2f99ead1e9a" width="550" alt="Desktop View" />
      </td>
    </tr>
  </table>
</div>

<details>
  <summary align="center"><b>📸 Click to see more screenshots (Video Calls & Profile)</b></summary>
  <div align="center">
    <br/>
    <table border="0">
      <tr>
        <td align="center">
          <img src="https://github.com/user-attachments/assets/9837d467-fc14-4a75-ad38-56d6577f3d50" width="400" alt="Whisperwave Secondary View" />
        </td>
        <td align="center">
          <img src="https://github.com/user-attachments/assets/88669dae-e723-4078-8635-5fd52e405768" width="400" alt="User Profile View" />
        </td>
      </tr>
      <tr>
         <td align="center">
          <img src="https://github.com/user-attachments/assets/a06afb13-511a-49ce-acd2-9eb5c0601b2d" width="400" alt="Video Call Interface" />
        </td>
        <td align="center">
          <img src="https://github.com/user-attachments/assets/cedc53bc-f6f2-492a-9bc3-2ff78254dd6b" width="400" alt="Full Interface View" />
        </td>
      </tr>
    </table>
  </div>
</details>

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
