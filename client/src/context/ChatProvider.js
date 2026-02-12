import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
    // state for getting the current user chat
    const [currentChat, setCurrentChat] = useState();
    // state for getting current user
    const [user, setUser] = useState();
    // state for chats
    const [chats, setChats] = useState([]);

    const navigate = useNavigate();

    // get the current loggedin user
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setUser(user);

        if (user) navigate('/home');
        else navigate('/');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateChatList = (message) => {
        setChats((prevChats) => {
            const chatIndex = prevChats.findIndex((c) => c._id === message.chat._id);
            if (chatIndex === -1) return prevChats;

            const updatedChat = {
                ...prevChats[chatIndex],
                lastMessage: message,
                updatedAt: new Date().toISOString(),
            };

            const otherChats = prevChats.filter((c) => c._id !== message.chat._id);
            return [updatedChat, ...otherChats];
        });
    };

    return (
        <ChatContext.Provider
            value={{
                currentChat,
                setCurrentChat,
                user,
                setUser,
                chats,
                setChats,
                updateChatList
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const ChatState = () => {
    return useContext(ChatContext);
};

export default ChatProvider;
