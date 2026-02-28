import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    const updateChatList = useCallback(
        (message) => {
            setChats((prevChats) => {
                const targetId = message.chatId || message.chat?._id;
                const targetChat = prevChats.find((c) => c._id === targetId);

                if (!targetChat) return prevChats;

                const isFromMe = message.sender?._id === user?._id || message.sender === user?._id;
                const isChatOpen = currentChat?._id === targetId;

                const currentCount = targetChat.unseenCount || 0;
                const newCount = isChatOpen ? 0 : !isFromMe ? currentCount + 1 : currentCount;

                const updatedChat = {
                    ...targetChat,
                    lastMessage: message,
                    updatedAt: new Date().toISOString(),
                    unseenCount: newCount,
                };

                return [updatedChat, ...prevChats.filter((c) => c._id !== targetId)];
            });
        },
        [currentChat, user?._id],
    );

    const updateChatListOnDelete = useCallback(
        (chatId, newLastMessage, deletedMessageTime) => {
            setChats((prevChats) => {
                const targetChat = prevChats.find((c) => c._id === chatId);
                if (!targetChat) return prevChats;

                let newUnseenCount = targetChat.unseenCount || 0;
                const msgTime = new Date(deletedMessageTime).getTime();

                const lastReadTime = targetChat.myLastReadAt ? new Date(targetChat.myLastReadAt).getTime() : 0;

                if (msgTime > lastReadTime && newUnseenCount > 0) newUnseenCount -= 1;

                return prevChats.map((c) =>
                    c._id === chatId
                        ? {
                            ...c,
                            lastMessage: newLastMessage !== undefined ? newLastMessage : c.lastMessage,
                            unseenCount: newUnseenCount,
                        }
                        : c,
                );
            });
        },
        [user?._id],
    );

    return (
        <ChatContext.Provider
            value={{
                currentChat,
                setCurrentChat,
                user,
                setUser,
                chats,
                setChats,
                updateChatList,
                updateChatListOnDelete,
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
