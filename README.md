# Whisperwave

Whisperwave is a feature-rich chatting application built using the MERN stack (MongoDB, Express.js, React, and Node.js) and WebSockets through socket.io for real-time communication. This application allows users to connect with friends, family, and colleagues, providing a seamless chatting experience with various advanced features.

## Live Demo 🚀

Check out the live demo of Whisperwave [here](https://whisperwave.onrender.com/).

## Features

- **Real-time Communication**: Instant messaging with real-time updates using WebSockets.
- **Group Chats**: Create and join group chats for collaborative discussions.
- **File Sharing**: Share files, images, and documents within chats.
- **User Authentication**: Secure login and registration with JWT (JSON Web Tokens).
- **Profile Management**: Customize user profiles with avatars and status messages.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Technologies Used

- **Frontend**: React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: socket.io
- **Authentication**: JWT, bcrypt
- **Styling**: CSS

## Installation

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
   set up environment variables using ".env copy" file by renaming it to ".env" and passing correct values

4. **Start the application**
   1. Terminal for Backend
      ```bash
      cd server
      npx nodemon index.js
    2. Terminal for frontend
       ```bash
       cd client
       npm run dev

5. **Access Application at this url**
Open your browser and navigate to http://localhost:5173.

## Usage
1. Register: Create a new account by providing a username, email, and password.
2. Login: Access your account with your credentials.
3. Start Chatting: Begin a new conversation by searching for users or creating a group chat.
4. Send Messages: Enjoy real-time messaging with instant notifications and file sharing capabilities.

## Contributions
Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to follow the coding guidelines and include relevant tests.

## Contact
For any questions or inquiries, please contact md.krazio@gmail.com.
