import { useEffect, useState } from 'react';
import ChatMenu from '../../components/chatmenu/ChatMenu';
import ChatBox from '../../components/chatbox/ChatBox';
import ConfirmModal from '../../components/confimModal/ConfirmModal';
import { ChatState } from '../../context/ChatProvider';
import { io } from 'socket.io-client';
import './chathome.css';

const ChatHome = () => {
    const { user, currentChat, setUser } = ChatState();

    const [fetchAgain, setFetchAgain] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        setUser(loggedInUser);
    }, [setUser]);

    useEffect(() => {
        const SERVER_URL =
            window.location.origin.includes("https")
                ? window.location.origin
                : process.env.REACT_APP_SERVER_URL;

        const socketInstance = io(SERVER_URL);
        socketInstance.emit('setup', user?._id);

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const shouldRenderComponents = user && socket;

    return (
        <div className="chat-home">
            {shouldRenderComponents && (
                <>
                    <div className={`chatmenu ${currentChat ? 'active' : ''}`}>
                        <ChatMenu socket={socket} fetchAgain={fetchAgain} />
                    </div>

                    <div className={`chatbox ${currentChat ? 'active' : ''}`}>
                        <ChatBox socket={socket} fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} setShowConfirmModal={setShowConfirmModal} />
                    </div>
                </>
            )}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <ConfirmModal
                            setShowConfirmModal={setShowConfirmModal}
                            setFetchAgain={setFetchAgain}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHome;
