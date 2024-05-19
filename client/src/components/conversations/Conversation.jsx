import './conversation.css';
import { useEffect, useMemo } from 'react';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { ChatState } from '../../context/ChatProvider';

const Conversation = ({ socket, loggedUser, chat, newMessageCount, setNewMessageCount }) => {
    const { currentChat, setChats } = ChatState();

    const getLastMessage = useMemo(() => {
        const truncatedTextLength = 35;
        if (chat.lastMessage) {
            const { sender, text } = chat.lastMessage;
            const truncatedText = text.length > truncatedTextLength ? text.substring(0, truncatedTextLength) + '...' : text;
            if (truncatedText)
                return `${sender.username} : ${truncatedText}`;
            else
                return `${sender.username} : Photo`;
        }
        return '';
    }, [chat]);

    const moveChatToTop = (chatId) => {
        setChats((prevChats) => {
            const chatIndex = prevChats.findIndex((chat) => chat._id === chatId);

            if (chatIndex !== -1) {
                const chatToMove = prevChats.splice(chatIndex, 1)[0];
                prevChats.unshift(chatToMove);
            }

            return [...prevChats];
        });
    };

    const updateLastMessage = (chatId, newMessage) => {
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat._id === chatId ? { ...chat, lastMessage: newMessage } : chat
            )
        );
    };

    useEffect(() => {
        socket.on("messageRecieved", (newMessageRecieved) => {
            updateLastMessage(newMessageRecieved.chat._id, newMessageRecieved);
            moveChatToTop(newMessageRecieved.chat._id);
        });
        // eslint-disable-next-line
    }, [socket]);

    const isSelectedChat = currentChat && currentChat._id === chat._id;
    const chatUserProfilePic = getProfilePic(loggedUser, chat);
    const currentChatName = getCurrentChatName(loggedUser, chat);

    return (
        <div
            className={`userChat ${isSelectedChat ? 'selectedChat' : ''}`}
            onClick={() => {
                setNewMessageCount((prevCounts) => ({ ...prevCounts, [chat._id]: 0, }));
            }}
        >
            <img className="conversationImg" src={chatUserProfilePic} alt="" />
            <div className="chatDetails">
                <span className="userChatName">{currentChatName}</span>
                <span className="lastMessage">{getLastMessage}</span>
            </div>
            {newMessageCount > 0 && <span className="newMessageBadge">{newMessageCount}</span>}
        </div>
    );
};

export default Conversation;
