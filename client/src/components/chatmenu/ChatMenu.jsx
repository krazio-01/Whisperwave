import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CSSTransition } from 'react-transition-group';
import NewChat from '../newChat/NewChat';
import NewGroup from '../newGroupChat/NewGroup';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import Conversation from '../conversations/Conversation';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import { ChatState } from '../../context/ChatProvider';
import { getProfilePic } from '../../utils/chatUtils';
import './chatmenu.css';
import profile from '../../Assets/images/profile.png';
import logout from '../../Assets/images/logout.png';
import pen from '../../Assets/images/pen.png';
import { FaSearch } from 'react-icons/fa';
import { IoPersonAddSharp } from 'react-icons/io5';
import { FaUserGroup } from 'react-icons/fa6';

const ChatMenu = ({ socket, fetchAgain }) => {
    const { user, chats, setChats, currentChat, setCurrentChat } = ChatState();

    const dropdownRef = useRef(null);
    const bubbleMenuRef = useRef(null);

    const [loggedUser, setLoggedUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bubbleMenuContainer, setBubbleMenuContainer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUI, setCurrentUI] = useState('chat');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    const handleSearchInputChange = (event) => {
        const { value } = event.target;
        setSearchQuery(value);

        if (!loggedUser) return;

        const filteredUsers = chats.filter((chat) => {
            if (chat.isGroupChat) return chat.chatName.toLowerCase().includes(value.toLowerCase());
            else {
                const otherMember = chat.members.find((member) => member._id !== loggedUser._id);
                return otherMember ? otherMember.username.toLowerCase().includes(value.toLowerCase()) : false;
            }
        });
        setFilteredUsers(filteredUsers);
    };

    const chatList = searchQuery.trim() === '' ? chats : filteredUsers;

    const handleLogout = () => {
        setIsDropdownOpen(false);
        setCurrentUI('chat');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const fetchChats = async () => {
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
    };

    useEffect(() => {
        setLoggedUser(JSON.parse(localStorage.getItem('user')));
        fetchChats();
        // eslint-disable-next-line
    }, [fetchAgain]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (newMessageRecieved) => {
            setChats((prevChats) => {
                const chatIndex = prevChats.findIndex((c) => c._id === newMessageRecieved.chat._id);

                if (chatIndex === -1) return prevChats;

                const chatToUpdate = prevChats[chatIndex];
                const isChatOpen = currentChat && currentChat._id === chatToUpdate._id;
                const newCount = isChatOpen ? 0 : (chatToUpdate.unseenCount || 0) + 1;

                const updatedChat = {
                    ...chatToUpdate,
                    lastMessage: newMessageRecieved,
                    unseenCount: newCount,
                    updatedAt: new Date().toISOString(),
                };

                const otherChats = prevChats.filter((c) => c._id !== chatToUpdate._id);
                return [updatedChat, ...otherChats];
            });
        };

        socket.on('messageRecieved', handleMessageReceived);

        return () => {
            socket.off('messageRecieved', handleMessageReceived);
        };
    }, [socket, currentChat, setChats]);

    const handleAddConversation = (newChat) => {
        setChats((prevChat) => [newChat, ...prevChat]);
    };

    const handleUiChange = (uiName) => {
        setCurrentUI(uiName);
        if (uiName === 'profile') setIsDropdownOpen(!isDropdownOpen);
        else setBubbleMenuContainer(!bubbleMenuContainer);
    };

    const handleChatClick = (chat) => {
        if (currentChat && currentChat._id === chat._id) return;

        setCurrentChat(chat);
        setChats((prev) => prev.map((c) => (c._id === chat._id ? { ...c, unseenCount: 0 } : c)));
    };

    return (
        <div className="chatMenuWrapper">
            {currentUI === 'chat' ? (
                <>
                    <div className="menu-topbar">
                        <div className="profile">
                            <img
                                className="profilepic"
                                src={getProfilePic(user, null)}
                                alt="profile"
                                onClick={() => {
                                    setIsDropdownOpen(!isDropdownOpen);
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
                        ) : (
                            chatList.map((chat) => (
                                <div key={chat._id} onClick={() => handleChatClick(chat)}>
                                    <Conversation loggedUser={loggedUser} chat={chat} />
                                </div>
                            ))
                        )}
                    </div>

                    <div className="newChatButton-div">
                        <button
                            type="button"
                            className="newChatButton"
                            onClick={() => {
                                setBubbleMenuContainer(!bubbleMenuContainer);
                            }}
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
                <NewChat setCurrentUI={setCurrentUI} handleAddConversation={handleAddConversation} />
            ) : currentUI === 'group' ? (
                <NewGroup setCurrentUI={setCurrentUI} />
            ) : currentUI === 'profile' ? (
                <ProfileInfo style={{ width: '100%' }} currentUI={currentUI} setCurrentUI={setCurrentUI} />
            ) : null}
        </div>
    );
};

export default ChatMenu;
