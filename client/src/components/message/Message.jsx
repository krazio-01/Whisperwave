import { useState, useMemo } from 'react';
import moment from 'moment';
import { getChatImages } from '../../utils/chatUtils';
import './message.css';
import encryptionManager from '../../services/EncryptionManager';

const Message = ({ message, own, isGroupChat }) => {
    const [viewImage, setViewImage] = useState(false);
    const messageImg = getChatImages(message);

    const decryptedText = useMemo(() => {
        console.log('Decrypting message:', encryptionManager.decrypt(message.text));
        return encryptionManager.decrypt(message.text);
    }, [message.text]);

    const handleImageClick = () => {
        setViewImage(!viewImage);
    };

    return (
        <div className={own ? 'message own' : 'message'}>
            <div className="messageTop">
                <img className="messageUserImg" src={message.sender.profilePicture} alt="User" />

                <div className="messageContent">
                    {messageImg ? (
                        <div className="msgWithImg">
                            {!own && isGroupChat && (
                                <p className="messageSenderName in-image">{message.sender.username}</p>
                            )}
                            <img className="messageImg" src={messageImg} alt="attachment" onClick={handleImageClick} />
                            {message.text && <p className="msgWithImgText">{decryptedText}</p>}
                        </div>
                    ) : (
                        <div className="messageText">
                            {!own && isGroupChat && <p className="messageSenderName">{message.sender.username}</p>}
                            {decryptedText}
                        </div>
                    )}
                </div>
            </div>

            <div className="messageBottom">{moment(message.createdAt).fromNow()}</div>

            {viewImage && (
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
