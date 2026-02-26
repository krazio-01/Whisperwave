import { useState, useMemo, useRef } from 'react';
import moment from 'moment';
import { CSSTransition } from 'react-transition-group';
import { getChatImages } from '../../utils/chatUtils';
import encryptionManager from '../../services/EncryptionManager';
import { BsThreeDotsVertical } from 'react-icons/bs';
import useClickOutside from '../../hooks/useClickOutside';
import { MdOutlineContentCopy, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';
import './message.css';

const Message = ({ message, own, isGroupChat, chatId, typing, typingMembers = [], setMessageToDelete }) => {
    const [viewImage, setViewImage] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const menuRef = useRef(null);

    useClickOutside(menuRef, () => setShowMenu(false));

    const messageImg = !typing && message ? getChatImages(message) : null;

    const decryptedText = useMemo(() => {
        if (typing || !message?.text) return '';
        return encryptionManager.decrypt(message.text, chatId);
    }, [message?.text, chatId, typing]);

    const handleImageClick = () => {
        if (!typing) setViewImage(!viewImage);
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        setShowMenu((prev) => !prev);
    };

    const handleCopy = async (e) => {
        e.stopPropagation();
        if (!decryptedText) return;

        try {
            await navigator.clipboard.writeText(decryptedText);
            toast.success('Message copied!', { autoClose: 1200 });
        } catch (error) {
            console.error('Failed to copy text:', error);
            toast.error('Failed to copy message');
        } finally {
            setShowMenu(false);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setMessageToDelete(message._id);
        setShowMenu(false);
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
            <div className="message-wrapper">
                <div className="message-content-container">
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
                </div>

                {!typing && (
                    <div className={`message-options-trigger ${showMenu ? 'active' : ''}`} onClick={toggleMenu}>
                        <BsThreeDotsVertical />
                    </div>
                )}

                <CSSTransition
                    in={showMenu}
                    timeout={300}
                    classNames="message-menu-transition"
                    unmountOnExit
                    nodeRef={menuRef}
                >
                    <div className="message-menu" ref={menuRef}>
                        <button onClick={handleCopy}>
                            <MdOutlineContentCopy />
                            <span>Copy</span>
                        </button>
                        <button onClick={handleDelete}>
                            <MdDelete />
                            <span>Delete</span>
                        </button>
                    </div>
                </CSSTransition>

                {viewImage && messageImg && (
                    <div className="fullscreenImage">
                        <span className="closeIcon" onClick={handleImageClick}>
                            &times;
                        </span>
                        <img className="fullscreenImageImg" src={messageImg} alt="User" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
