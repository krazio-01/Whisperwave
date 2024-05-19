import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';
import axios from 'axios';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Message from '../message/Message';
import MoreOption from '../moreOption/MoreOption';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import FilePreview from '../filePreview/FilePreview';
import { ChatState } from '../../context/ChatProvider';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { CircularProgress } from '@mui/material';
import './chatbox.css';
import sendIcon from '../../Assets/images/send.png';
import emojiPicker from '../../Assets/images/emojiPicker.png';
import fileSelection from '../../Assets/images/fileSelection.png';
import previewClose from '../../Assets/images/previewClose.png';
import BackIcon from '../../Assets/images/back.png';
import dotsIcon from '../../Assets/images/dots.png';

let selectedChatCompare;

const ChatBox = ({ socket, fetchAgain, setFetchAgain, setShowConfirmModal }) => {
    const { setNewMessageCount, currentChat, setCurrentChat, user } = ChatState();

    const inputRef = useRef(null);
    const scrollRef = useRef();
    const pickerRef = useRef(null);
    const profileRef = useRef(null);
    const threeDotsRef = useRef(null);
    const imagePreviewRef = useRef(null);

    const [textareaHeight, setTextareaHeight] = useState('4.5rem');
    const [messages, setMessages] = useState([]);
    const [fetchMessagesLoading, setFetchMessagesLoading] = useState(false);
    const [msgSendLoading, setMsgSendLoading] = useState(false);
    const [newMessages, setNewMessages] = useState('');
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isUserOnline, setIsUserOnline] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showProfileInfo, setShowProfileInfo] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showMoreOption, setShowMoreOption] = useState(false);

    const handleInput = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) return;
        textarea.style.height = '4.5rem';

        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;

        if (scrollHeight > clientHeight) {
            textarea.style.height = `${scrollHeight}px`;
            setTextareaHeight(`${scrollHeight}px`);
        } else {
            setTextareaHeight(`${clientHeight}px`);
        }
    }, []);

    // Memoized handleSubmit function
    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (newMessages.trim().length > 0) {
            const message = {
                text: newMessages,
                chatId: currentChat._id,
            };

            setMsgSendLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            try {
                const { data } = await axios.post('/messages', message, config);
                setMessages((prevMessages) => [...prevMessages, data]);
                socket.emit('sendMessage', data);
                setNewMessages('');
                setMsgSendLoading(false);
            } catch (err) {
                console.error(err.message);
            }
        }
    }, [newMessages, currentChat, user.authToken, socket]);

    // Memoized fetchMessages function
    const fetchMessages = useCallback(async () => {
        if (!currentChat) return;

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            setFetchMessagesLoading(true);
            const { data } = await axios.get(`/messages/${currentChat._id}`, config);
            setMessages(data);
            setFetchMessagesLoading(false);
        } catch (error) {
            console.log(error.message);
        }
    }, [currentChat, user.authToken]);

    // Memoized handleEmojiPick function
    const handleEmojiPick = useCallback((e) => {
        const ref = inputRef.current;
        ref.focus();
        const start = newMessages.substring(0, ref.selectionStart);
        const end = newMessages.substring(ref.selectionStart);
        const text = start + e.native + end;
        setNewMessages(text);
    }, [newMessages]);

    // Memoized handleFileChange function
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setShowPreview(true);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // for resetting the height of textArea to normal
    useEffect(() => {
        handleInput();
    }, [newMessages, handleInput]);

    useEffect(() => {
        socket.on('onlineUsers', (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.disconnect();
        }
    }, [socket]);

    useEffect(() => {
        setIsUserOnline(onlineUsers.includes(currentChat?.members.find(m => m._id !== user._id)?._id));
        // eslint-disable-next-line
    }, [onlineUsers, currentChat]);

    useEffect(() => {
        fetchMessages();
        socket.emit("joinChat", currentChat?._id);
        selectedChatCompare = currentChat;

        setNewMessageCount((prevCounts) => ({
            ...prevCounts,
            [currentChat?._id]: 0,
        }));
        // eslint-disable-next-line
    }, [currentChat]);

    useEffect(() => {
        let isTabFocused = true;

        socket.on("messageRecieved", (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
                setNewMessageCount((prevCounts) => ({
                    ...prevCounts,
                    [newMessageRecieved.chat._id]: (prevCounts[newMessageRecieved.chat._id] || 0) + 1,
                }));
            }
            else {
                setMessages((prevMessages) => {
                    if (prevMessages.find((message) => message._id === newMessageRecieved._id)) return prevMessages;
                    return [...prevMessages, newMessageRecieved];
                });
            }

            // Only show the notification if the page is not focused
            if (!isTabFocused) {
                if (Notification.permission === "granted") {
                    new Notification(newMessageRecieved.sender.username, {
                        body: newMessageRecieved.text
                    });
                }

                else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then((permission) => {
                        if (permission === "granted") {
                            new Notification(newMessageRecieved.sender.username, {
                                body: newMessageRecieved.text
                            });
                        }
                    });
                }
            }
        });

        // Function to handle visibility change
        const handleVisibilityChange = () => {
            isTabFocused = !document.hidden;

            // If the tab becomes visible, mark all new messages as read
            if (!document.hidden) {
                setNewMessageCount((prevCounts) => ({
                    ...prevCounts,
                    [currentChat?._id]: 0,
                }));
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        const handleBeforeUnload = () => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: "CLEAR_NOTIFICATIONS" });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
        // eslint-disable-next-line
    }, [socket]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const chatUserProfilePic = getProfilePic(user, currentChat);
    const userProfilePic = getProfilePic(user, null);
    const currentChatName = getCurrentChatName(user, currentChat);

    return (
        <div className="main">
            <div className={`chatBoxWrapper ${showProfileInfo ? 'active' : ''}`}>
                {currentChat ? (
                    <>
                        <div className="chatBoxTop">
                            <div className='closeConversation'>
                                <img src={BackIcon} alt='Back' onClick={() => setCurrentChat(null)} />
                            </div>
                            <img className='userImg' src={chatUserProfilePic} alt='User'></img>
                            <div className="userDetails" onClick={() => setShowProfileInfo(!showProfileInfo)}>
                                <span className='userName'>{currentChatName}</span>
                                <div className="status">
                                    {currentChat.isGroupChat ? <div className='numberOfMembers'>{currentChat.members.length} Members</div> : <>
                                        <div className='statusForPrivasteChats'>
                                            <div className="color" style={{ backgroundColor: isUserOnline ? '#2ecc71' : '#e74c3c' }}></div>
                                            <span className="userStatus">{isUserOnline ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </>}
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

                        <div className="messageWrapper">
                            <div className="userMessages">
                                <div className="messages">
                                    {fetchMessagesLoading ?
                                        <div className='messageLoading'>
                                            <CircularProgress color="primary" />
                                        </div> :
                                        (<>
                                            {messages.map((message) => (
                                                <div key={message.createdAt} ref={scrollRef}>
                                                    <Message
                                                        key={message._id}
                                                        message={message}
                                                        own={message.sender._id === user._id}
                                                        userProfilepic={userProfilePic}
                                                        chatUserProfilePic={chatUserProfilePic}
                                                    />
                                                </div>
                                            ))}
                                        </>)}
                                </div>
                            </div>

                            <div className="chatBoxBottom">
                                <div className="chatBoxbottomWrapper">
                                    <div className="input">
                                        <img className='emoji' src={emojiPicker} alt='Emoji Picker' onClick={() => setIsPickerVisible(!isPickerVisible)} />
                                        <CSSTransition in={isPickerVisible} timeout={200} classNames='emojiPicker' unmountOnExit nodeRef={pickerRef} >
                                            <div className="emojiPicker" ref={pickerRef}>
                                                <Picker
                                                    data={data}
                                                    previewPosition='none'
                                                    emojiSize={20} style={{ height: "20px" }}
                                                    onEmojiSelect={handleEmojiPick}
                                                />
                                            </div>
                                        </CSSTransition>

                                        <textarea className='chatMessageInput' placeholder='Message' onKeyDown={handleKeyDown} ref={inputRef} onInput={handleInput} onChange={(e) => { setNewMessages(e.target.value) }} value={newMessages} style={{ '--textarea-height': textareaHeight }} />

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
                        </div>
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
