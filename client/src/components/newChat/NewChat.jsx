import { useState } from 'react';
import backBtn from '../../Assets/images/backBtn.png';
import { FaSearch, FaUserPlus, FaUserTimes, FaCommentDots } from 'react-icons/fa';
import axios from 'axios';
import { ChatState } from '../../context/ChatProvider';
import { CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import './newchat.css';

const NewChat = ({ setCurrentUI, handleAddConversation }) => {
    const [searchLoading, setSearchLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [receiverId, setReceiverId] = useState(null);
    const [foundMessage, setFoundMessage] = useState(false);

    const { user } = ChatState();

    const handleSearch = async () => {
        if (!username) return;

        const config = { headers: { Authorization: `Bearer ${user.authToken}` } };

        try {
            setSearchLoading(true);
            setFoundMessage(false);
            setSearchResult(null);

            const { data } = await axios.post('/users/searchUser', { username, loggedUser: user }, config);

            setSearchResult(data);
            setReceiverId(data._id);
        } catch (error) {
            if (error.response && error.response.status === 404) setFoundMessage('User not found');
            else setFoundMessage('An error occurred while searching.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') handleSearch();
    };

    const handleStartChatting = async () => {
        const senderId = user._id;
        const selectedReceiverId = receiverId;

        try {
            const config = { headers: { Authorization: `Bearer ${user.authToken}` } };
            setChatLoading(true);
            const response = await axios.post('/chat/newChat', { senderId, selectedReceiverId }, config);
            handleAddConversation(response.data);
            setCurrentUI('chat');
        } catch (error) {
            if (error.response && error.response.status === 400)
                toast.success(error.response.data, { autoClose: 2000, theme: 'dark' });
        } finally {
            setChatLoading(false);
        }
    };

    const renderContent = () => {
        if (searchLoading) {
            return (
                <div className="emptyState">
                    <CircularProgress size={40} style={{ marginBottom: '20px', color: '#6e44ff' }} />
                    <h3>Searching...</h3>
                    <p>Looking for users matching "{username}"</p>
                </div>
            );
        }

        if (searchResult) {
            return (
                <div className="userFoundCard">
                    <div className="info-wrapper">
                        <div className="userAvatarPlaceholder">{searchResult.username.charAt(0).toUpperCase()}</div>
                        <div className="userInfo">
                            <h3>{searchResult.username}</h3>
                            <p>User found! Ready to chat.</p>
                        </div>
                    </div>
                    <button className="startChatBtn" onClick={handleStartChatting} disabled={chatLoading}>
                        {chatLoading ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            <>
                                <FaCommentDots /> Start
                            </>
                        )}
                    </button>
                </div>
            );
        }

        if (foundMessage) {
            return (
                <div className="emptyState">
                    <FaUserTimes className="emptyIcon error" />
                    <h3>User not found</h3>
                    <p>
                        We couldn't find anyone with the username "<strong>{username}</strong>".
                    </p>
                </div>
            );
        }

        return (
            <div className="emptyState">
                <FaUserPlus className="emptyIcon" />
                <h3>Find People</h3>
                <p>Enter a username above to find friends and start a new conversation.</p>
            </div>
        );
    };

    return (
        <div className="newChat">
            <div className="newChatTop">
                <img className="backButtonMessage" src={backBtn} alt="Back" onClick={() => setCurrentUI('chat')} />
                <div className="searchUserForMessage">
                    <FaSearch className="searchIcon" />
                    <input
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Search username..."
                        className={searchLoading ? 'loading-chatMenuSearch' : 'chatMenuSearch'}
                        onKeyUp={handleKeyPress}
                        autoFocus
                    />
                </div>
            </div>

            <div className="resultContainer">{renderContent()}</div>
        </div>
    );
};

export default NewChat;
