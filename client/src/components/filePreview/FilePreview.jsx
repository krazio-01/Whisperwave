import React, { useState, useRef, useCallback } from 'react';
import './filepreview.css';
import axios from 'axios';
import { CircularProgress } from '@mui/material';
import { ChatState } from '../../context/ChatProvider';

const FilePreview = ({ previewClose, selectedFile, setSelectedFile, setShowPreview, socket, sendIcon, setMessages }) => {
    const filePreviewInput = useRef();

    const { user, currentChat } = ChatState();
    const [loading, setLoading] = useState(false);
    const [newMessages, setNewMessages] = useState('');

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();

        setLoading(true);
        const formData = new FormData();
        formData.append('text', newMessages);
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
            setMessages((prevMessages) => [...prevMessages, data]);
            socket.emit('sendMessage', data);
            setNewMessages('');
            setSelectedFile(null);
            setShowPreview(false);
            setLoading(false);
        }
        catch (err) {
            console.error(err.message);
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [newMessages, currentChat, user.authToken, socket]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <>
            <div className='previewImageContainer'>
                {selectedFile && <img className='previewImage' src={URL.createObjectURL(selectedFile)} alt='' />}
                <img className='previewClose' src={previewClose} alt='' onClick={() => setShowPreview(false)} />
            </div>

            <div className="previewInput">
                <input
                    placeholder='type anything...'
                    type="text" ref={filePreviewInput}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => { setNewMessages(e.target.value) }}
                />
                <button className='previewSendBtn' onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={24} color="primary" /> : <img src={sendIcon} alt='Send' />}
                </button>
            </div>
        </>
    )
}

export default FilePreview;
