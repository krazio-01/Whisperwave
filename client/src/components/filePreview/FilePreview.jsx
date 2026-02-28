import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { CircularProgress } from '@mui/material';
import { ChatState } from '../../context/ChatProvider';
import encryptionManager from '../../services/EncryptionManager';
import './filepreview.css';

const FilePreview = ({
    previewClose,
    selectedFile,
    setSelectedFile,
    setShowPreview,
    socket,
    sendIcon,
    setMessages,
}) => {
    const filePreviewInput = useRef();

    const { user, currentChat } = ChatState();
    const [loading, setLoading] = useState(false);
    const [newMessages, setNewMessages] = useState('');

    const handleSubmit = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            setLoading(true);

            const encryptedCaption = newMessages ? encryptionManager.encrypt(newMessages, currentChat._id) : '';

            const formData = new FormData();
            formData.append('text', encryptedCaption);
            formData.append('chatId', currentChat._id);
            formData.append('image', selectedFile);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            try {
                const { data } = await axios.post('/messages', formData, config);
                const messageData = {
                    ...data.message,
                    chatId: currentChat._id,
                };
                setMessages((prevMessages) => [...prevMessages, messageData]);
                socket.emit('chat:send-message', {
                    ...messageData,
                    members: currentChat.members.map((m) => m._id || m),
                });
                setNewMessages('');
                setSelectedFile(null);
                setShowPreview(false);
                setLoading(false);
            } catch (err) {
                console.error(err.message);
                setLoading(false);
            }
        },
        [newMessages, currentChat, user.authToken, socket, setSelectedFile, setMessages, setShowPreview, selectedFile],
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <>
            <div className="previewImageContainer">
                {selectedFile && <img className="previewImage" src={URL.createObjectURL(selectedFile)} alt="" />}
                <img className="previewClose" src={previewClose} alt="" onClick={() => setShowPreview(false)} />
            </div>

            <div className="previewInput">
                <input
                    placeholder="Add a caption..."
                    type="text"
                    ref={filePreviewInput}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setNewMessages(e.target.value);
                    }}
                />
                <button className="previewSendBtn" onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={24} color="primary" /> : <img src={sendIcon} alt="Send" />}
                </button>
            </div>
        </>
    );
};

export default FilePreview;
