import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
    // state for getting the current user chat
    const [currentChat, setCurrentChat] = useState();
    // state for getting current user
    const [user, setUser] = useState();
    // state for chats
    const [chats, setChats] = useState([]);
    // state for storing a count for new messages
    const [newMessageCount, setNewMessageCount] = useState({});

    const navigate = useNavigate();

    // get the current loggedin user
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        setUser(user);

        if (user)
            navigate("/home");
        else
            navigate("/");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ChatContext.Provider
            value={{
                currentChat,
                setCurrentChat,
                user,
                setUser,
                chats,
                setChats,
                newMessageCount,
                setNewMessageCount,
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
