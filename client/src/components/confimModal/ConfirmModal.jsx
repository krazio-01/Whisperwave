import { useState } from 'react';
import { ChatState } from '../../context/ChatProvider';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import './confirmModal.css';

const ConfirmModal = ({ setShowConfirmModal, setFetchAgain }) => {
    const [loading, setLoading] = useState(false);
    const { user, currentChat, setCurrentChat } = ChatState();

    const handleConfirm = async () => {
        if (!currentChat) return;
        setLoading(true);

        try {
            const { _id: chatId, isGroupChat } = currentChat;

            const requestOptions = isGroupChat
                ? {
                    method: 'PUT',
                    url: '/chat/leave',
                    data: { chatId, userId: user._id },
                    successMsg: "Left Group Successfully"
                }
                : {
                    method: 'DELETE',
                    url: '/chat/deleteChat',
                    data: { chatId },
                    successMsg: "Chat Deleted Successfully"
                };

            await axios({
                method: requestOptions.method,
                url: requestOptions.url,
                data: requestOptions.data,
                headers: { Authorization: `Bearer ${user.authToken}` },
            });

            toast.success(requestOptions.successMsg);

            setCurrentChat(null);
            setFetchAgain((prev) => !prev);
            setShowConfirmModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Error Occurred");
        } finally {
            setLoading(false);
        }
    };

    const modalMessage = currentChat?.isGroupChat
        ? `Are you sure you want to leave "${currentChat?.chatName}"?`
        : "Are you sure you want to delete this conversation?";

    return (
        <div className="confirmModal">
            <span>{modalMessage}</span>

            <div className="button-container">
                <button
                    id="btn1"
                    className="modal-btn"
                    onClick={() => setShowConfirmModal(false)}
                >
                    Cancel
                </button>

                <button
                    id="btn2"
                    className={loading ? "loading-modal-btn" : "modal-btn"}
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} style={{ color: '#DC1C1C' }} />
                    ) : (
                        "Confirm"
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
