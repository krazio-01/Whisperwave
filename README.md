# Whisperwave

Whisperwave is a real-time chat application built with the MERN stack. It goes beyond basic messaging by offering advanced features like chat-specific encryption for privacy, WebRTC for seamless voice and video calls, and Redis caching for incredibly fast message retrieval.

## Live Demo 🚀

Check out the live demo of Whisperwave [here](https://whisperwave.onrender.com/).

<div align="center">
  <img src="https://github.com/user-attachments/assets/8c24cba3-c560-4769-9045-19136869e39f" width="49%" alt="Whisperwave Main Chat Interface" />
  <img src="https://github.com/user-attachments/assets/7eb11bd9-291a-4161-bd59-fad4534630f9" width="49%" alt="Whisperwave Secondary View" />
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
        <img src="https://github.com/user-attachments/assets/12bfee4b-0c97-43e2-afb2-3f2a72f6c961" width="160" alt="Mobile List" />
      </td>
      <td align="center" valign="middle">
        <img src="https://github.com/user-attachments/assets/854f03e8-55da-407b-bb00-9d08da7b7c71" width="160" alt="Mobile Chat" />
      </td>
      <td align="center" valign="middle">
        <img src="https://github.com/user-attachments/assets/99a51e93-c269-4386-ac48-b56faff76387" width="550" alt="Desktop View" />
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
          <img src="https://github.com/user-attachments/assets/97229667-ccc1-46e7-bc1e-ba3ebc52a3b7" width="400" alt="Video Call Interface" />
        </td>
        <td align="center">
          <img src="https://github.com/user-attachments/assets/3b116587-cb8d-4f57-b8cd-0b792fd03604" width="400" alt="User Profile View" />
        </td>
      </tr>
      <tr>
         <td align="center">
          <img src="https://github.com/user-attachments/assets/6b09f019-b9d0-4e04-bdaf-f5640a933601" width="400" alt="Screenshot 2026-03-06 233301" />
        </td>
        <td align="center">
          <img src="https://github.com/user-attachments/assets/cedc53bc-f6f2-492a-9bc3-2ff78254dd6b" width="400" alt="Full Interface View" />
        </td>
      </tr>
    </table>
  </div>
</details>

<!-- <details>
  <summary align="center"><b>📸 Click to see more screenshots (Video Calls & Profile)</b></summary>
  <div align="center">
    <br>
    <img src="https://github.com/user-attachments/assets/97229667-ccc1-46e7-bc1e-ba3ebc52a3b7" width="90%" alt="Video Call Interface" />
    <br><br>
    <img src="https://github.com/user-attachments/assets/3b116587-cb8d-4f57-b8cd-0b792fd03604" width="90%" alt="User Profile View" />
     <br/>
     <img width="1908" height="934" alt="image" src="https://github.com/user-attachments/assets/cedc53bc-f6f2-492a-9bc3-2ff78254dd6b" />
  </div>
</details> -->

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
