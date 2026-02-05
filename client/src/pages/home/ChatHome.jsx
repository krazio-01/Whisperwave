import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import ChatMenu from '../../components/chatmenu/ChatMenu';
import ChatBox from '../../components/chatbox/ChatBox';
import ConfirmModal from '../../components/confimModal/ConfirmModal';
import { ChatState } from '../../context/ChatProvider';
import { CircularProgress } from '@mui/material';
import './chathome.css';

const ChatHome = () => {
    const { user, currentChat, setUser } = ChatState();

    const [fetchAgain, setFetchAgain] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [socket, setSocket] = useState(null);

    const SERVER_URL = useMemo(() => {
        return window.location.origin.includes('https') ? window.location.origin : process.env.REACT_APP_SERVER_URL;
    }, []);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (loggedInUser && !user) setUser(loggedInUser);
    }, [setUser, user]);

    useEffect(() => {
        if (!user) return;

        const socketInstance = io(SERVER_URL);

        socketInstance.emit('setup', user._id);

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            socketInstance.off();
        };
    }, [user, SERVER_URL]);

    if (!user) {
        return (
            <div className="loading-screen">
                <CircularProgress size={32} color="inherit" />
                <h3 className="loading-text">Loading Workspace...</h3>
            </div>
        );
    }

    return (
        <div className="chat-home">
            {socket && (
                <>
                    <div className={`chatmenu ${currentChat ? 'active' : ''}`}>
                        <ChatMenu socket={socket} fetchAgain={fetchAgain} />
                    </div>

                    <div className={`chatbox ${currentChat ? 'active' : ''}`}>
                        <ChatBox
                            socket={socket}
                            fetchAgain={fetchAgain}
                            setFetchAgain={setFetchAgain}
                            setShowConfirmModal={setShowConfirmModal}
                        />
                    </div>
                </>
            )}

            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <ConfirmModal setShowConfirmModal={setShowConfirmModal} setFetchAgain={setFetchAgain} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHome;
