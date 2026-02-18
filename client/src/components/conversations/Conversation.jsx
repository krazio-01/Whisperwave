import { useMemo } from 'react';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { ChatState } from '../../context/ChatProvider';
import encryptionManager from '../../services/EncryptionManager';
import moment from 'moment';
import './conversation.css';

const Conversation = ({ loggedUser, chat }) => {
    const { currentChat } = ChatState();

    const getLastMessage = useMemo(() => {
        const truncatedTextLength = 35;

        if (chat.lastMessage) {
            const { sender, text } = chat.lastMessage;
            const decryptedFullText = encryptionManager.decrypt(text || '', chat?._id);

            const truncatedText =
                decryptedFullText.length > truncatedTextLength
                    ? decryptedFullText.substring(0, truncatedTextLength) + '...'
                    : decryptedFullText;

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
            <div className='chat-details-wrapper'>
                <div className="chatDetails">
                    <span className="userChatName">{currentChatName}</span>
                    <span className="lastMessage">{getLastMessage}</span>
                </div>

                <div className='right-section'>
                    {chat.lastMessage && <div className="last-message-time">{moment(chat?.lastMessage?.createdAt).fromNow()}</div>}
                    {chat.unseenCount > 0 && <span className="newMessageBadge">{chat.unseenCount}</span>}
                </div>
            </div>
        </div>
    );
};

export default Conversation;
