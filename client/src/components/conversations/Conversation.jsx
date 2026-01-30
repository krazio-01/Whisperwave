import { useMemo } from 'react';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { ChatState } from '../../context/ChatProvider';
import './conversation.css';

const Conversation = ({ loggedUser, chat }) => {
    const { currentChat } = ChatState();

    const getLastMessage = useMemo(() => {
        const truncatedTextLength = 35;
        if (chat.lastMessage) {
            const { sender, text } = chat.lastMessage;
            const msgText = text || "";

            const truncatedText = msgText.length > truncatedTextLength
                ? msgText.substring(0, truncatedTextLength) + '...'
                : msgText;

            if (truncatedText) return `${sender.username} : ${truncatedText}`;
            return `${sender.username} : Photo`;
        }
        return '';
    }, [chat]);

    const isSelectedChat = currentChat && currentChat._id === chat._id;
    const chatUserProfilePic = getProfilePic(loggedUser, chat);
    const currentChatName = getCurrentChatName(loggedUser, chat);

    return (
        <div className={`userChat ${isSelectedChat ? 'selectedChat' : ''}`}>
            <img className="conversationImg" src={chatUserProfilePic} alt="" />
            <div className="chatDetails">
                <span className="userChatName">{currentChatName}</span>
                <span className="lastMessage">{getLastMessage}</span>
            </div>

            {(chat.unseenCount > 0) && (
                <span className="newMessageBadge">{chat.unseenCount}</span>
            )}
        </div>
    );
};

export default Conversation;
