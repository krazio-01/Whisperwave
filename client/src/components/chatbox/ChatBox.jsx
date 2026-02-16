import { useEffect, useRef, useState, useMemo } from 'react';
import { CSSTransition } from 'react-transition-group';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import CallModal from '../callModal/callModal';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import { ChatState } from '../../context/ChatProvider';
import useWebRTC from '../../hooks/useWebRTC';
import { getProfilePic } from '../../utils/chatUtils';
import EmptyState from '../miscellaneous/emptyState/EmptyState';
import encryptionManager from '../../services/EncryptionManager';
import './chatbox.css';

const ChatBox = ({ socket, fetchAgain, setFetchAgain, setShowConfirmModal }) => {
    const { currentChat, setCurrentChat, user } = ChatState();

    const profileRef = useRef(null);
    const currentChatRef = useRef(currentChat);

    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showProfileInfo, setShowProfileInfo] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);

    const { call, handleStartCall, handleAcceptCall, handleEndCall, updateCallState, toggleMedia } = useWebRTC(
        socket,
        user,
        currentChat,
    );

    const isUserOnline = useMemo(() => {
        if (!currentChat || currentChat?.isGroupChat) return false;
        const otherMember = currentChat?.members?.find((m) => m?._id !== user?._id);
        return otherMember ? onlineUsers.includes(otherMember?._id) : false;
    }, [onlineUsers, currentChat, user?._id]);

    const toggleProfile = () => setShowProfileInfo((prev) => !prev);

    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied')
            Notification.requestPermission();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleOnlineUsers = (users) => setOnlineUsers(users);

        const handleTyping = ({ chatId, userId }) => {
            if (userId === user._id) return;
            if (currentChatRef.current?._id !== chatId) return;

            setTypingUsers((prev) => {
                if (prev.includes(userId)) return prev;
                return [...prev, userId];
            });
        };

        const handleStopTyping = ({ chatId, userId }) => {
            if (currentChatRef.current?._id !== chatId) return;

            setTypingUsers((prev) => {
                if (!prev.includes(userId)) return prev;
                return prev.filter((id) => id !== userId);
            });
        };

        const handleMessageReceived = (newMessage) => {
            const activeChat = currentChatRef.current;

            if (activeChat && activeChat._id === newMessage.chat._id) {
                setMessages((prev) => (prev.some((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]));
                setTypingUsers((prev) => prev.filter((id) => id !== newMessage.sender._id));
            }

            // Handle Notification
            if (!document.hasFocus() && Notification.permission === 'granted' && newMessage.sender._id !== user._id) {
                const decryptedText = encryptionManager.decrypt(newMessage.text, newMessage.chat._id);
                new Notification(newMessage.sender.username, {
                    body: decryptedText || 'Message Recieved',
                    icon: getProfilePic(newMessage.sender, null),
                });
            }
        };

        socket.on('user:online-list', handleOnlineUsers);
        socket.on('typing:start', handleTyping);
        socket.on('typing:stop', handleStopTyping);
        socket.on('chat:message-received', handleMessageReceived);

        return () => {
            socket.off('user:online-list', handleOnlineUsers);
            socket.off('typing:start', handleTyping);
            socket.off('typing:stop', handleStopTyping);
            socket.off('chat:message-received', handleMessageReceived);
        };
    }, [socket, user._id]);

    return (
        <div className="main">
            <div className={`chatBoxWrapper ${showProfileInfo ? 'active' : ''}`}>
                {currentChat ? (
                    <>
                        <ChatHeader
                            user={user}
                            currentChat={currentChat}
                            setCurrentChat={setCurrentChat}
                            isUserOnline={isUserOnline}
                            handleStartCall={handleStartCall}
                            fetchAgain={fetchAgain}
                            setShowConfirmModal={setShowConfirmModal}
                            setShowProfileInfo={toggleProfile}
                            showProfileInfo={showProfileInfo}
                        />

                        <ChatMessages
                            currentChat={currentChat}
                            user={user}
                            socket={socket}
                            messages={messages}
                            setMessages={setMessages}
                            typingUsers={typingUsers}
                        />

                        <ChatInput currentChat={currentChat} user={user} socket={socket} setMessages={setMessages} />
                    </>
                ) : (
                    <div className="noConversation-wrapper">
                        <EmptyState src="./animations/start-chat.lottie" title="Open a conversation to start chat." />
                    </div>
                )}
            </div>

            <CSSTransition
                in={showProfileInfo}
                timeout={350}
                classNames="profileInfo"
                unmountOnExit
                nodeRef={profileRef}
            >
                <div ref={profileRef} className="profileTranisitionDiv">
                    <ProfileInfo
                        setShowProfileInfo={toggleProfile}
                        fetchAgain={fetchAgain}
                        setFetchAgain={setFetchAgain}
                    />
                </div>
            </CSSTransition>

            <CallModal
                user={user}
                call={call}
                toggleMedia={toggleMedia}
                updateCallState={updateCallState}
                endCall={handleEndCall}
                acceptCall={handleAcceptCall}
            />
        </div>
    );
};

export default ChatBox;
