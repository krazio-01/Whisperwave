import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CSSTransition } from 'react-transition-group';
import NewChat from '../newChat/NewChat';
import NewGroup from '../newGroupChat/NewGroup';
import Conversation from '../conversations/Conversation';
import ProfileInfo from '../miscellaneous/profileInfo/Profile';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import { ChatState } from '../../context/ChatProvider';
import { getProfilePic } from '../../utils/chatUtils';
import './chatmenu.css';
import profile from '../../Assets/images/profile.png';
import logout from '../../Assets/images/logout.png';
import pen from '../../Assets/images/pen.png';
import group from '../../Assets/images/group.png';
import search from "../../Assets/images/search.png";

const ChatMenu = ({ socket, fetchAgain }) => {
    const { newMessageCount, setNewMessageCount, setCurrentChat, user, chats, setChats } = ChatState();

    const dropdownRef = useRef(null);
    const bubbleMenuRef = useRef(null);

    const [loggedUser, setLoggedUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bubbleMenuContainer, setBubbleMenuContainer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUI, setCurrentUI] = useState("chat");
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    const handleSearchInputChange = (event) => {
        const { value } = event.target;
        setSearchQuery(value);

        const filteredUsers = chats.filter((chat) => {
            if (chat.isGroupChat)
                return chat.chatName.toLowerCase().includes(value.toLowerCase());
            else {
                const otherMember = chat.members.find((member) => member._id !== loggedUser._id);
                return otherMember.username.toLowerCase().includes(value.toLowerCase());
            }
        });
        setFilteredUsers(filteredUsers);
    };

    const chatList = searchQuery.trim() === '' ? chats : filteredUsers;

    // Logout logic
    const handleLogout = () => {
        setIsDropdownOpen(false);
        setCurrentUI("chat");
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    // get the conversation data
    const fetchChats = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            const { data } = await axios.get("/chat/fetchChats", config);
            setChats(data.chats);
            setNewMessageCount(data.unseenMessageCounts);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching chats:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoggedUser(JSON.parse(localStorage.getItem("user")));
        fetchChats();
        // eslint-disable-next-line
    }, [fetchAgain]);

    const handleAddConversation = (newChat) => {
        setChats((prevChat) => [...prevChat, newChat]);
    };

    const handleUiChange = (uiName) => {
        setCurrentUI(uiName);
        if (uiName === 'profile')
            setIsDropdownOpen(!isDropdownOpen);
        else
            setBubbleMenuContainer(!bubbleMenuContainer);
    };

    return (
        <div className="chatMenuWrapper">
            {currentUI === "chat" ? (
                <>
                    <div className="menu-topbar">
                        <div className="profile">
                            <img className="profilepic" src={getProfilePic(user, null)} alt="" onClick={() => { setIsDropdownOpen(!isDropdownOpen) }}/>

                            <CSSTransition in={isDropdownOpen} timeout={250} classNames="dropdown" unmountOnExit nodeRef={dropdownRef}>
                                <div className="dropdown-menu" ref={dropdownRef}>
                                    <button className='menu-item' onClick={() => handleUiChange("profile")}>
                                        <img className="dropdown-item-img" src={profile} alt="Profile" />
                                        Profile
                                    </button>

                                    <button className='menu-item' onClick={handleLogout}>
                                        <img className="dropdown-item-img" src={logout} alt="Profile" />
                                        Logout
                                    </button>
                                </div>
                            </CSSTransition>
                        </div>

                        <div className="menu-searchBar">
                            <img src={search} alt='Search'></img>
                            <input placeholder='Search' className='chatMenuSearch' value={searchQuery} onChange={handleSearchInputChange}></input>
                        </div>
                    </div>

                    <div className="chats">
                        {chatList.map((chat) => (
                            <div key={chat._id} onClick={() => setCurrentChat(chat)}>
                                {loading ? <ListItemSkeleton /> :
                                    <Conversation
                                        socket={socket}
                                        loggedUser={loggedUser}
                                        chat={chat}
                                        newMessageCount={newMessageCount[chat._id] || 0}
                                        setNewMessageCount={setNewMessageCount}
                                    />}
                            </div>
                        ))}
                    </div>

                    <div className="newChatButton-div" >
                        <button type='button' className='newChatButton' onClick={() => { setBubbleMenuContainer(!bubbleMenuContainer) }}>
                            <img src={pen} alt='New Chat' />
                        </button>
                        <CSSTransition in={bubbleMenuContainer} timeout={250} classNames="menuContainer" unmountOnExit nodeRef={bubbleMenuRef}>
                            <div className="menuContainer" ref={bubbleMenuRef}>
                                <button className='menu-item' onClick={() => handleUiChange("message")}>
                                    <img className="dropdown-item-img" src={profile} alt="Profile" />
                                    New Message
                                </button>
                                <button className='menu-item' onClick={() => handleUiChange("group")}>
                                    <img className="dropdown-item-img" src={group} alt="Profile" />
                                    New Group
                                </button>
                            </div>
                        </CSSTransition>
                    </div>
                </>
            ) : currentUI === "message" ? (
                <NewChat setCurrentUI={setCurrentUI} handleAddConversation={handleAddConversation} />
            ) : currentUI === "group" ? (
                <NewGroup setCurrentUI={setCurrentUI} />
            ) : currentUI === "profile" ? (
                <ProfileInfo style={{ width: '100%' }} currentUI={currentUI} setCurrentUI={setCurrentUI} />
            ) : null}
        </div>
    );
};

export default ChatMenu;
