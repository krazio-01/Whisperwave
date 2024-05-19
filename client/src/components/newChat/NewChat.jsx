import React, { useState } from 'react';
import './newchat.css';
import backBtn from '../../Assets/images/backBtn.png';
import search from "../../Assets/images/search.png";
import axios from 'axios';
import { ChatState } from '../../context/ChatProvider';
import { CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

const NewChat = ({ setCurrentUI, handleAddConversation }) => {
    const [searchLoading, setSearchLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [receiverId, setReceiverId] = useState(null);
    const [foundMessage, setFoundMessage] = useState(false);

    const { user } = ChatState();

    // for search input field
    const handleSearch = async () => {

        if (username) {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            try {
                setSearchLoading(true);
                const { data } = await axios.post('/users/searchUser', { username, loggedUser: user }, config);
                setSearchResult(data);
                setReceiverId(data._id);
                setSearchLoading(false);
            }
            catch (error) {
                setSearchLoading(false);
                if (error.response && error.response.status === 404)
                    setFoundMessage('User not found');
                else
                    setFoundMessage('An error occurred while searching for the user.');
            }
        }
    };

    // to handle keyboard input event
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    // for adding a new conversation
    const handleStartChatting = async () => {
        const senderId = user._id;
        const selectedReceiverId = receiverId;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            setChatLoading(true);
            const response = await axios.post('/chat/newChat', { senderId, selectedReceiverId }, config);
            const newConversation = response.data;
            handleAddConversation(newConversation);
            setCurrentUI("chat");
            setChatLoading(false);
        }
        catch (error) {
            setChatLoading(false);
            if (error.response && error.response.status === 400)
                toast.success(error.response.data, {
                    autoClose: 2000,
                    theme: 'dark',
                });
        }
    };

    return (
        <div className='newChat'>
            <div className="newChatTop">

                <img className='backButtonMessage' src={backBtn} alt='Back' onClick={() => { setCurrentUI("chat") }}></img>

                <div className="searchUserForMessage">
                    <img src={search} alt='Search'></img>
                    <input
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder='Enter username to search'
                        className={searchLoading ? 'loading-chatMenuSearch' : 'chatMenuSearch'}
                        onKeyPress={handleKeyPress}
                    />
                    {searchLoading && <CircularProgress size={24} color="info" />}
                </div>
            </div>

            <div className="result">
                {searchResult ? (
                    <div className="fetchedUser">
                        <span className='username'>{searchResult.username}</span>
                        <button
                            className='addUserBtn'
                            onClick={handleStartChatting}
                            disabled={chatLoading}>
                            {chatLoading ? 'Creating...' : 'Start Chat'}
                        </button>
                    </div>
                ) : <span className='noUserFound'>{foundMessage ? foundMessage : 'Search for a user'}</span>}
            </div>
        </div>
    )
}

export default NewChat
