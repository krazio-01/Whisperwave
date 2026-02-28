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

    const [loggedUser, setLoggedUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bubbleMenuContainer, setBubbleMenuContainer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUI, setCurrentUI] = useState('chat');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    useClickOutside(dropDownParentRef, () => setIsDropdownOpen(false));
    useClickOutside(bubbleMenuParentRef, () => setBubbleMenuContainer(false));

    const handleSearchInputChange = (event) => {
        const { value } = event.target;
        setSearchQuery(value);

        if (!loggedUser) return;

        const searchResults = chats.filter((chat) => {
            if (chat.isGroupChat) return chat.chatName.toLowerCase().includes(value.toLowerCase());
            else {
                const otherMember = chat.members.find((member) => member._id !== loggedUser._id);
                return otherMember ? otherMember.username.toLowerCase().includes(value.toLowerCase()) : false;
            }
        });
        setFilteredUsers(searchResults);
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
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chats:', error);
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

        const handleMessageReceived = (newMessageReceived) => {
            updateChatList(newMessageReceived);
        };

        const handleMessageDeleted = (payload) => {
            updateChatListOnDelete(payload.chatId, payload.newLastMessage, payload.messageCreatedAt);
        };

        socket.on('chat:message-received', handleMessageReceived);
        socket.on('chat:message-deleted', handleMessageDeleted);

        return () => {
            socket.off('chat:message-received', handleMessageReceived);
            socket.off('chat:message-deleted', handleMessageDeleted);
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
        setChats((prev) =>
            prev.map((c) =>
                c._id === chat._id
                    ? {
                        ...c,
                        unseenCount: 0,
                        myLastReadAt: new Date().toISOString(),
                    }
                    : c,
            ),
        );
    };

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
                        ) : chatList.length > 0 ? (
                            chatList.map((chat) => (
                                <div key={chat._id} onClick={() => handleChatClick(chat)}>
                                    <Conversation loggedUser={loggedUser} chat={chat} />
                                </div>
                            ))
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
