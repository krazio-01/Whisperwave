import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CSSTransition } from 'react-transition-group';
import axios from 'axios';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { CircularProgress } from '@mui/material';
import Message from '../message/Message';
import MoreOption from '../moreOption/MoreOption';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import FilePreview from '../filePreview/FilePreview';
import { ChatState } from '../../context/ChatProvider';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import './chatbox.css';
import sendIcon from '../../Assets/images/send.png';
import emojiPicker from '../../Assets/images/emojiPicker.png';
import fileSelection from '../../Assets/images/fileSelection.png';
import previewClose from '../../Assets/images/previewClose.png';
import BackIcon from '../../Assets/images/back.png';
import dotsIcon from '../../Assets/images/dots.png';

const ChatBox = ({ socket, fetchAgain, setFetchAgain, setShowConfirmModal }) => {
    const { currentChat, setCurrentChat, user } = ChatState();

    const inputRef = useRef(null);
    const scrollRef = useRef();
    const pickerRef = useRef(null);
    const profileRef = useRef(null);
    const threeDotsRef = useRef(null);
    const imagePreviewRef = useRef(null);

    const currentChatRef = useRef(currentChat);

    const [textareaHeight, setTextareaHeight] = useState('4.5rem');
    const [messages, setMessages] = useState([]);
    const [fetchMessagesLoading, setFetchMessagesLoading] = useState(false);
    const [msgSendLoading, setMsgSendLoading] = useState(false);
    const [newMessages, setNewMessages] = useState('');
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const [showProfileInfo, setShowProfileInfo] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showMoreOption, setShowMoreOption] = useState(false);

    const chatUserProfilePic = useMemo(() => getProfilePic(user, currentChat), [user, currentChat]);
    const userProfilePic = useMemo(() => getProfilePic(user, null), [user]);
    const currentChatName = useMemo(() => getCurrentChatName(user, currentChat), [user, currentChat]);

    const isUserOnline = useMemo(() => {
        if (!currentChat || currentChat?.isGroupChat) return false;
        const otherMember = currentChat?.members?.find(m => m?._id !== user?._id);
        return otherMember ? onlineUsers.includes(otherMember?._id) : false;
    }, [onlineUsers, currentChat, user?._id]);

    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    useEffect(() => {
        if (Notification.permission !== "granted" && Notification.permission !== "denied")
            Notification.requestPermission();
    }, []);

    const handleInput = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        textarea.style.height = '4.5rem';
        const { scrollHeight, clientHeight } = textarea;

        if (scrollHeight > clientHeight) {
            const newHeight = `${scrollHeight}px`;
            textarea.style.height = newHeight;
            setTextareaHeight(newHeight);
        } else {
            setTextareaHeight(`${clientHeight}px`);
        }
    }, []);

    useEffect(() => {
        handleInput();
    }, [newMessages, handleInput]);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!newMessages.trim() || !currentChat) return;

        setMsgSendLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            const messagePayload = {
                text: newMessages,
                chatId: currentChat._id,
            };

            const { data } = await axios.post('/messages', messagePayload, config);

            setMessages((prev) => [...prev, data]);
            socket.emit('sendMessage', data);
            setNewMessages('');
            setTextareaHeight('4.5rem');
        } catch (err) {
            console.error("Error sending message:", err.message);
        } finally {
            setMsgSendLoading(false);
        }
    }, [newMessages, currentChat, user.authToken, socket]);

    const fetchMessages = useCallback(async () => {
        if (!currentChat) return;

        setFetchMessagesLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            const { data } = await axios.get(`/messages/${currentChat._id}`, config);
            setMessages(data);
            socket.emit("joinChat", currentChat._id);
        } catch (error) {
            console.error("Error fetching messages:", error.message);
        } finally {
            setFetchMessagesLoading(false);
        }
    }, [currentChat, user.authToken, socket]);

    const handleEmojiPick = useCallback((e) => {
        const ref = inputRef.current;
        if (ref) ref.focus();

        setNewMessages(prev => {
            if (!ref) return prev + e.native;
            const start = prev.substring(0, ref.selectionStart);
            const end = prev.substring(ref.selectionStart);
            return start + e.native + end;
        });
    }, []);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowPreview(true);
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // --- Effects ---
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleOnlineUsers = (users) => setOnlineUsers(users);
        socket.on('onlineUsers', handleOnlineUsers);

        const handleMessageReceived = (newMessageReceived) => {
            const activeChat = currentChatRef.current;

            if (activeChat && activeChat._id === newMessageReceived.chat._id) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === newMessageReceived._id)) return prev;
                    return [...prev, newMessageReceived];
                });
            }

            if (!document.hasFocus() && Notification.permission === "granted") {
                if (newMessageReceived.sender._id !== user._id) {
                    new Notification(newMessageReceived.sender.username, {
                        body: newMessageReceived.text || "Message Recieved",
                        icon: getProfilePic(newMessageReceived.sender, null),
                    });
                }
            }
        };

        socket.on("messageRecieved", handleMessageReceived);

        return () => {
            socket.off('onlineUsers', handleOnlineUsers);
            socket.off("messageRecieved", handleMessageReceived);
        };
    }, [socket, user._id]);

    const renderHeader = () => (
        <div className="chatBoxTop">
            <div className='closeConversation'>
                <img src={BackIcon} alt='Back' onClick={() => setCurrentChat(null)} />
            </div>
            <img className='userImg' src={chatUserProfilePic} alt='User' />
            <div className="userDetails" onClick={() => setShowProfileInfo(!showProfileInfo)}>
                <span className='userName'>{currentChatName}</span>
                <div className="status">
                    {currentChat.isGroupChat ? (
                        <div className='numberOfMembers'>{currentChat.members.length} Members</div>
                    ) : (
                        <div className='statusForPrivasteChats'>
                            <div className="color" style={{ backgroundColor: isUserOnline ? '#2ecc71' : '#e74c3c' }}></div>
                            <span className="userStatus">{isUserOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="threeDotsContainer">
                <div className="threeDots" onClick={() => setShowMoreOption(!showMoreOption)}>
                    <img src={dotsIcon} alt='Dots' />
                </div>
                <CSSTransition in={showMoreOption} timeout={250} classNames='moreOptions' unmountOnExit nodeRef={threeDotsRef}>
                    <div className="moreOptionDropdown" ref={threeDotsRef}>
                        <MoreOption
                            fetchAgain={fetchAgain}
                            setShowConfirmModal={setShowConfirmModal}
                            setShowMoreOption={setShowMoreOption}
                            setShowProfileInfo={setShowProfileInfo}
                            showProfileInfo={showProfileInfo}
                        />
                    </div>
                </CSSTransition>
            </div>
        </div>
    );

    const renderMessages = () => (
        <div className="messageWrapper">
            <div className="userMessages">
                <div className="messages">
                    {fetchMessagesLoading ? (
                        <div className='messageLoading'>
                            <CircularProgress color="primary" />
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message._id || message.createdAt} ref={scrollRef}>
                                <Message
                                    message={message}
                                    own={message.sender._id === user._id}
                                    userProfilepic={userProfilePic}
                                    chatUserProfilePic={chatUserProfilePic}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderInputArea = () => (
        <div className="chatBoxBottom">
            <div className="chatBoxbottomWrapper">
                <div className="input">
                    <img className='emoji' src={emojiPicker} alt='Emoji Picker' onClick={() => setIsPickerVisible(!isPickerVisible)} />
                    <CSSTransition in={isPickerVisible} timeout={200} classNames='emojiPicker' unmountOnExit nodeRef={pickerRef}>
                        <div className="emojiPicker" ref={pickerRef}>
                            <Picker
                                data={data}
                                previewPosition='none'
                                emojiSize={20}
                                style={{ height: "20px" }}
                                onEmojiSelect={handleEmojiPick}
                            />
                        </div>
                    </CSSTransition>

                    <textarea
                        className='chatMessageInput'
                        placeholder='Message'
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        onInput={handleInput}
                        onChange={(e) => setNewMessages(e.target.value)}
                        value={newMessages}
                        style={{ '--textarea-height': textareaHeight }}
                    />

                    <div>
                        <input className='file-select' style={{ display: 'none' }} type="file" id="file" onChange={handleFileChange} />
                        <label htmlFor="file">
                            <img className='file' src={fileSelection} alt='File Selection' />
                        </label>
                        <CSSTransition in={showPreview} timeout={250} classNames='imaageTransition' unmountOnExit nodeRef={imagePreviewRef}>
                            <div className="imagePreview" ref={imagePreviewRef}>
                                <FilePreview
                                    previewClose={previewClose}
                                    selectedFile={selectedFile}
                                    setSelectedFile={setSelectedFile}
                                    setShowPreview={setShowPreview}
                                    socket={socket}
                                    sendIcon={sendIcon}
                                    setMessages={setMessages}
                                />
                            </div>
                        </CSSTransition>
                    </div>
                </div>

                <button className='chatSendBtn' onClick={handleSubmit} disabled={msgSendLoading}>
                    {msgSendLoading ? <CircularProgress size={28} color="primary" /> : <img src={sendIcon} alt='Send' />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="main">
            <div className={`chatBoxWrapper ${showProfileInfo ? 'active' : ''}`}>
                {currentChat ? (
                    <>
                        {renderHeader()}
                        {renderMessages()}
                        {renderInputArea()}
                    </>
                ) : (
                    <span className='noConversationText'>Open a conversation to start chat.</span>
                )}
            </div>

            <CSSTransition in={showProfileInfo} timeout={350} classNames='profileInfo' unmountOnExit nodeRef={profileRef}>
                <div ref={profileRef} className='profileTranisitionDiv'>
                    <ProfileInfo
                        setShowProfileInfo={setShowProfileInfo}
                        fetchMessages={fetchMessages}
                        fetchAgain={fetchAgain}
                        setFetchAgain={setFetchAgain}
                    />
                </div>
            </CSSTransition>
        </div>
    );
};

export default ChatBox;
