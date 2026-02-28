import { useState, useMemo, useRef } from 'react';
import moment from 'moment';
import { CSSTransition } from 'react-transition-group';
import { getChatImages } from '../../utils/chatUtils';
import encryptionManager from '../../services/EncryptionManager';
import { BsThreeDotsVertical } from 'react-icons/bs';
import useClickOutside from '../../hooks/useClickOutside';
import { MdOutlineContentCopy, MdDelete, MdCheck, MdDoneAll, MdInfoOutline, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import './message.css';

const Message = ({
    message,
    own,
    isGroupChat,
    chatId,
    typing,
    typingMembers = [],
    setMessageToDelete,
    readWatermarks = {},
    chatMembers = [],
}) => {
    const [viewImage, setViewImage] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const menuRef = useRef(null);
    const infoRef = useRef(null);

    useClickOutside(menuRef, () => setShowMenu(false));
    useClickOutside(infoRef, () => setShowInfo(false));

    const messageImg = !typing && message ? getChatImages(message) : null;

    const decryptedText = useMemo(() => {
        if (typing || !message?.text) return '';
        return encryptionManager.decrypt(message.text, chatId);
    }, [message?.text, chatId, typing]);

    const isReadByAll = useMemo(() => {
        if (!own || typing || !chatMembers.length || !message?.createdAt) return false;

        const messageTime = new Date(message.createdAt).getTime();

        return chatMembers.every((member) => {
            if (member._id === message.sender._id) return true;
            const userWatermark = readWatermarks[member._id];
            return userWatermark && messageTime <= userWatermark;
        });
    }, [own, typing, chatMembers, readWatermarks, message?.createdAt, message?.sender?._id]);

    const { readBy, deliveredTo } = useMemo(() => {
        if (!showInfo || !own || typing || !chatMembers.length) return { readBy: [], deliveredTo: [] };

        const messageTime = new Date(message.createdAt).getTime();
        const read = [];
        const delivered = [];

        chatMembers.forEach((member) => {
            if (member._id === message.sender._id) return;

            const userWatermark = readWatermarks[member._id];
            if (userWatermark && messageTime <= userWatermark) read.push(member);
            else delivered.push(member);
        });

        return { readBy: read, deliveredTo: delivered };
    }, [showInfo, own, typing, chatMembers, readWatermarks, message?.createdAt, message?.sender?._id]);

    const handleImageClick = () => {
        if (!typing) setViewImage(!viewImage);
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        setShowMenu((prev) => !prev);
        setShowInfo(false);
    };

    const handleInfoClick = (e) => {
        e.stopPropagation();
        setShowInfo(true);
        setShowMenu(false);
    };

    const handleCopy = async (e) => {
        e.stopPropagation();
        if (!decryptedText) return;
        try {
            await navigator.clipboard.writeText(decryptedText);
            toast.success('Message copied!', { autoClose: 1200 });
        } catch (error) {
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

                    {!typing && (
                        <div className="messageBottom" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {moment(message.createdAt).format('LT')}
                            {own && (
                                <span className="message-ticks" style={{ display: 'flex', alignItems: 'center' }}>
                                    {isReadByAll ? (
                                        <MdDoneAll size={16} color="#34B7F1" />
                                    ) : (
                                        <MdCheck size={16} color="#999" />
                                    )}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {!typing && (
                    <div
                        className={`message-options-trigger ${showMenu || showInfo ? 'active' : ''}`}
                        onClick={toggleMenu}
                    >
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
                        {own && (
                            <button onClick={handleInfoClick}>
                                <MdInfoOutline />
                                <span>Info</span>
                            </button>
                        )}
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

                <CSSTransition
                    in={showInfo}
                    timeout={300}
                    classNames="message-menu-transition"
                    unmountOnExit
                    nodeRef={infoRef}
                >
                    <div className="info-popover" ref={infoRef}>
                        <div className="info-header">
                            <span>Message Info</span>
                            <MdClose
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInfo(false);
                                }}
                            />
                        </div>
                        <div className="info-body">
                            <div className="info-section">
                                <span className="info-section-title">
                                    <MdDoneAll size={14} color="#34B7F1" /> Read by
                                </span>
                                {readBy.length === 0 ? (
                                    <span className="empty-info">No one yet</span>
                                ) : (
                                    readBy.map((user) => (
                                        <div key={user._id} className="info-user-row">
                                            <img src={user.profilePicture} alt={user.username} />
                                            <span>{user.username}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="info-section">
                                <span className="info-section-title">
                                    <MdCheck size={14} color="#999" /> Delivered to
                                </span>
                                {deliveredTo.length === 0 ? (
                                    <span className="empty-info">Everyone</span>
                                ) : (
                                    deliveredTo.map((user) => (
                                        <div key={user._id} className="info-user-row">
                                            <img src={user.profilePicture} alt={user.username} />
                                            <span>{user.username}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
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
