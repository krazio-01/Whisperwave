import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { CSSTransition } from 'react-transition-group';
import NewChat from '../newChat/NewChat';
import NewGroup from '../newGroupChat/NewGroup';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import Conversation from '../conversations/Conversation';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import { ChatState } from '../../context/ChatProvider';
import { getProfilePic } from '../../utils/chatUtils';
import profile from '../../Assets/images/profile.png';
import logout from '../../Assets/images/logout.png';
import pen from '../../Assets/images/pen.png';
import { FaSearch } from 'react-icons/fa';
import { IoPersonAddSharp } from 'react-icons/io5';
import { FaUserGroup } from 'react-icons/fa6';
import EmptyState from '../miscellaneous/emptyState/EmptyState';
import useClickOutside from '../../hooks/useClickOutside';
import './chatmenu.css';

const ChatMenu = ({ socket, fetchAgain }) => {
    const { user, chats, setChats, currentChat, setCurrentChat, updateChatList, updateChatListOnDelete } = ChatState();

    const dropdownRef = useRef(null);
    const dropDownParentRef = useRef(null);
    const bubbleMenuRef = useRef(null);
    const bubbleMenuParentRef = useRef(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bubbleMenuContainer, setBubbleMenuContainer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUI, setCurrentUI] = useState('chat');
    const [searchQuery, setSearchQuery] = useState('');
    const [typingChats, setTypingChats] = useState({});

    useClickOutside(dropDownParentRef, () => setIsDropdownOpen(false));
    useClickOutside(bubbleMenuParentRef, () => setBubbleMenuContainer(false));

    const chatList = useMemo(() => {
        if (!searchQuery.trim() || !user) return chats;

        const lowerCaseQuery = searchQuery.toLowerCase();
        return chats.filter((chat) => {
            if (chat.isGroupChat) {
                return chat.chatName.toLowerCase().includes(lowerCaseQuery);
            } else {
                const otherMember = chat.members.find((member) => member._id !== user._id);
                return otherMember ? otherMember.username.toLowerCase().includes(lowerCaseQuery) : false;
            }
        });
    }, [chats, searchQuery, user]);

    const handleSearchInputChange = useCallback((event) => {
        setSearchQuery(event.target.value);
    }, []);

    const handleLogout = useCallback(() => {
        setIsDropdownOpen(false);
        setCurrentUI('chat');
        localStorage.removeItem('user');
        window.location.href = '/';
    }, []);

    const fetchChats = useCallback(async () => {
        if (!user?.authToken) return;

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            const { data } = await axios.get('/chat/fetchChats', config);
            setChats(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.authToken, setChats]);

    useEffect(() => {
        fetchChats();
    }, [fetchAgain, fetchChats]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessageReceived) => {
            updateChatList(newMessageReceived);
        };

        const handleMessageDeleted = (payload) => {
            updateChatListOnDelete(payload.chatId, payload.newLastMessage, payload.messageCreatedAt);
        };

        const handleTyping = ({ chatId, userId }) => {
            if (!user || userId === user._id) return;

            setTypingChats((prev) => {
                const chatTypingUsers = prev[chatId] || [];
                if (chatTypingUsers.includes(userId)) return prev;
                return { ...prev, [chatId]: [...chatTypingUsers, userId] };
            });
        };

        const handleStopTyping = ({ chatId, userId }) => {
            if (!user || userId === user._id) return;

            setTypingChats((prev) => {
                const chatTypingUsers = prev[chatId] || [];
                if (!chatTypingUsers.includes(userId)) return prev;

                const updatedUsers = chatTypingUsers.filter((id) => id !== userId);

                if (updatedUsers.length === 0) {
                    const newState = { ...prev };
                    delete newState[chatId];
                    return newState;
                }

                return { ...prev, [chatId]: updatedUsers };
            });
        };

        const handleNewChatReceived = (newChat) => {
            setChats((prev) => {
                if (prev.some((c) => c._id === newChat._id)) return prev;
                return [newChat, ...prev];
            });
        };

        const handleChatRemoved = ({ chatId }) => {
            setChats((prev) => prev.filter((c) => c._id !== chatId));
            setCurrentChat((prevCurrentChat) => {
                if (prevCurrentChat && prevCurrentChat._id === chatId) return null;
                return prevCurrentChat;
            });
        };

        socket.on('chat:message-received', handleMessageReceived);
        socket.on('chat:message-deleted', handleMessageDeleted);
        socket.on('typing:start', handleTyping);
        socket.on('typing:stop', handleStopTyping);
        socket.on('chat:new-received', handleNewChatReceived);
        socket.on('chat:removed', handleChatRemoved);

        return () => {
            socket.off('chat:message-received', handleMessageReceived);
            socket.off('chat:message-deleted', handleMessageDeleted);
            socket.off('typing:start', handleTyping);
            socket.off('typing:stop', handleStopTyping);
            socket.off('chat:new-received', handleNewChatReceived);
            socket.off('chat:removed', handleChatRemoved);
        };
    }, [socket, currentChat, setChats, updateChatList, updateChatListOnDelete, user]);

    const handleAddConversation = useCallback(
        (newChat) => {
            setChats((prevChat) => [newChat, ...prevChat]);
        },
        [setChats],
    );

    const handleUiChange = useCallback((uiName) => {
        setCurrentUI(uiName);
        if (uiName === 'profile') setIsDropdownOpen((prev) => !prev);
        else setBubbleMenuContainer((prev) => !prev);
    }, []);

    const handleChatClick = useCallback(
        (chatToOpen) => {
            setCurrentChat((prevCurrentChat) => {
                if (prevCurrentChat && prevCurrentChat._id === chatToOpen._id) return prevCurrentChat;
                return chatToOpen;
            });

            setChats((prev) =>
                prev.map((c) =>
                    c._id === chatToOpen._id ? { ...c, unseenCount: 0, myLastReadAt: new Date().toISOString() } : c,
                ),
            );
        },
        [setCurrentChat, setChats],
    );

    return (
        <div className="chatMenuWrapper">
            {currentUI === 'chat' ? (
                <>
                    <div className="menu-topbar">
                        <div className="profile" ref={dropDownParentRef}>
                            <img
                                className="profilepic"
                                src={getProfilePic(user, null)}
                                alt="profile"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDropdownOpen((prev) => !prev);
                                }}
                            />

                            <CSSTransition
                                in={isDropdownOpen}
                                timeout={250}
                                classNames="dropdown"
                                unmountOnExit
                                nodeRef={dropdownRef}
                            >
                                <div className="dropdown-menu" ref={dropdownRef}>
                                    <button className="menu-item" onClick={() => handleUiChange('profile')}>
                                        <img className="dropdown-item-img" src={profile} alt="Profile" />
                                        Profile
                                    </button>

                                    <button className="menu-item" onClick={handleLogout}>
                                        <img className="dropdown-item-img" src={logout} alt="Profile" />
                                        Logout
                                    </button>
                                </div>
                            </CSSTransition>
                        </div>

                        <div className="menu-searchBar">
                            <FaSearch />
                            <input
                                placeholder="Search"
                                className="chatMenuSearch"
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                            ></input>
                        </div>
                    </div>

                    <div className="chats">
                        {loading ? (
                            <ListItemSkeleton count={8} />
                        ) : chatList.length > 0 ? (
                            chatList.map((chat) => {
                                const isSomeoneTyping = !!(typingChats[chat._id] && typingChats[chat._id].length > 0);
                                return (
                                    <div key={chat._id} onClick={() => handleChatClick(chat)}>
                                        <Conversation
                                            loggedUser={user}
                                            chat={chat}
                                            isTyping={isSomeoneTyping}
                                            currentChat={currentChat}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state-container">
                                {searchQuery ? (
                                    <EmptyState
                                        src="./animations/communication.lottie"
                                        title="No chats found"
                                        description={`We couldn't find any chats matching "${searchQuery}"`}
                                        animationStyle={{ filter: 'invert(1)' }}
                                    />
                                ) : (
                                    <EmptyState
                                        src="/animations/empty-loading-state.lottie"
                                        title="It's quiet here..."
                                        description="Start a new conversation with friends or create a group!"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="newChatButton-div" ref={bubbleMenuParentRef}>
                        <button
                            type="button"
                            className="newChatButton"
                            onClick={() => setBubbleMenuContainer((prev) => !prev)}
                        >
                            <img src={pen} alt="New Chat" />
                        </button>
                        <CSSTransition
                            in={bubbleMenuContainer}
                            timeout={250}
                            classNames="menuContainer"
                            unmountOnExit
                            nodeRef={bubbleMenuRef}
                        >
                            <div className="menuContainer" ref={bubbleMenuRef}>
                                <button className="menu-item" onClick={() => handleUiChange('message')}>
                                    <IoPersonAddSharp />
                                    New Contact
                                </button>
                                <button className="menu-item" onClick={() => handleUiChange('group')}>
                                    <FaUserGroup />
                                    Create New Group
                                </button>
                            </div>
                        </CSSTransition>
                    </div>
                </>
            ) : currentUI === 'message' ? (
                <NewChat setCurrentUI={setCurrentUI} handleAddConversation={handleAddConversation} socket={socket} />
            ) : currentUI === 'group' ? (
                <NewGroup setCurrentUI={setCurrentUI} socket={socket} />
            ) : currentUI === 'profile' ? (
                <ProfileInfo style={{ width: '100%' }} currentUI={currentUI} setCurrentUI={setCurrentUI} />
            ) : null}
        </div>
    );
};

export default ChatMenu;
