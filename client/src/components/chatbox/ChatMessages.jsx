import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import Message from '../message/Message';

const ChatMessages = ({ currentChat, user, socket, messages, setMessages }) => {
    const [fetchMessagesLoading, setFetchMessagesLoading] = useState(false);

    const scrollRef = useRef();

    const fetchMessages = useCallback(async () => {
        if (!currentChat) return;

        setFetchMessagesLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.authToken}` },
            };

            const { data } = await axios.get(`/messages/${currentChat._id}`, config);

            setMessages(data);
            socket.emit('joinChat', currentChat._id);
        } catch (error) {
            console.error('Error fetching messages:', error.message);
        } finally {
            setFetchMessagesLoading(false);
        }
    }, [currentChat, user.authToken, socket, setMessages]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    return (
        <div className="messageWrapper">
            <div className="userMessages">
                <div className="messages">
                    {fetchMessagesLoading ? (
                        <div className="messageLoading">
                            <CircularProgress color="primary" />
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message._id || message.createdAt} ref={scrollRef}>
                                <Message
                                    message={message}
                                    own={message.sender._id === user._id}
                                    isGroupChat={currentChat?.isGroupChat}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ChatMessages);
