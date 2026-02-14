import { useState, useMemo } from 'react';
import moment from 'moment';
import { getChatImages } from '../../utils/chatUtils';
import './message.css';
import encryptionManager from '../../services/EncryptionManager';

const Message = ({ message, own, isGroupChat, chatId, typing, typingMembers = [] }) => {
    const [viewImage, setViewImage] = useState(false);

    const messageImg = !typing && message ? getChatImages(message) : null;

    const decryptedText = useMemo(() => {
        if (typing || !message?.text) return '';
        return encryptionManager.decrypt(message.text, chatId);
    }, [message?.text, chatId, typing]);

    const handleImageClick = () => {
        if (!typing) setViewImage(!viewImage);
    };

    const renderAvatars = () => {
        if (typing) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                    {typingMembers.slice(0, 3).map((member, index) => (
                        <img
                            key={member._id}
                            className="messageUserImg"
                            src={member?.profilePicture}
                            alt={member?.username}
                            style={{
                                marginLeft: index === 0 ? 0 : '-15px',
                                border: '2px solid #292929',
                                position: 'relative',
                                zIndex: 3 - index,
                            }}
                        />
                    ))}
                    {typingMembers.length > 3 && <div className="typing-more-count">+{typingMembers.length - 1}</div>}
                </div>
            );
        }

        return <img className="messageUserImg" src={message.sender.profilePicture} alt="User" />;
    };

    return (
        <div className={own ? 'message own' : 'message'}>
            <div className="messageTop">
                {renderAvatars()}

                <div className="messageContent">
                    {typing ? (
                        <div className="messageText typing-container">
                            <div className="typing-bubble">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messageImg ? (
                                <div className="msgWithImg">
                                    {!own && isGroupChat && (
                                        <p className="messageSenderName in-image">{message.sender.username}</p>
                                    )}
                                    <img
                                        className="messageImg"
                                        src={messageImg}
                                        alt="attachment"
                                        onClick={handleImageClick}
                                    />
                                    {message.text && <p className="msgWithImgText">{decryptedText}</p>}
                                </div>
                            ) : (
                                <div className="messageText">
                                    {!own && isGroupChat && (
                                        <p className="messageSenderName">{message.sender.username}</p>
                                    )}
                                    {decryptedText}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {!typing && <div className="messageBottom">{moment(message.createdAt).fromNow()}</div>}

            {viewImage && messageImg && (
                <div className="fullscreenImage">
                    <span className="closeIcon" onClick={handleImageClick}>
                        &times;
                    </span>
                    <img className="fullscreenImageImg" src={messageImg} alt="User" />
                </div>
            )}
        </div>
    );
};

export default Message;
