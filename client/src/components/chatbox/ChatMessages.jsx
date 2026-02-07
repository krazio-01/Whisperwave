import { memo, useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import Message from '../message/Message';

const ChatMessages = ({ currentChat, user, socket, messages, setMessages }) => {
    const [status, setStatus] = useState({
        loading: false,
        hasMore: false,
        page: 1,
    });

    const scrollContainerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const chatMeta = useRef({
        prevHeight: 0,
        isInitialLoad: true,
    });

    useEffect(() => {
        setMessages([]);
        chatMeta.current = { prevHeight: 0, isInitialLoad: true };
        setStatus({ loading: false, hasMore: false, page: 1 });
        fetchMessages(1, true);
    }, [currentChat._id]);

    const fetchMessages = useCallback(
        async (pageNum, initial = false) => {
            try {
                setStatus((prev) => ({ ...prev, loading: true }));

                if (scrollContainerRef.current) chatMeta.current.prevHeight = scrollContainerRef.current.scrollHeight;

                const { data } = await axios.get(`/messages/${currentChat._id}`, {
                    headers: { Authorization: `Bearer ${user.authToken}` },
                    params: { page: pageNum, limit: 20 },
                });

                setMessages((prev) => (initial ? data.messages : [...data.messages, ...prev]));
                setStatus((prev) => ({ ...prev, hasMore: data.hasMore, loading: false }));
                socket.emit('joinChat', currentChat._id);
            } catch (error) {
                console.error('Fetch error:', error);
                setStatus((prev) => ({ ...prev, loading: false }));
            }
        },
        [currentChat._id, user.authToken, setMessages, socket],
    );

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && status.hasMore && !status.loading) {
                    chatMeta.current.isInitialLoad = false;
                    const nextPage = status.page + 1;
                    setStatus((prev) => ({ ...prev, page: nextPage }));
                    fetchMessages(nextPage, false);
                }
            },
            { root: scrollContainerRef.current, threshold: 0.1 },
        );

        if (topSentinelRef.current) observer.observe(topSentinelRef.current);
        return () => observer.disconnect();
    }, [status.hasMore, status.loading, status.page, fetchMessages]);

    // Consolidated Scroll Management
    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (chatMeta.current.isInitialLoad) {
            container.scrollTop = container.scrollHeight;
        } else if (!chatMeta.current.isInitialLoad && chatMeta.current.prevHeight > 0) {
            const heightDiff = container.scrollHeight - chatMeta.current.prevHeight;
            container.scrollTop = heightDiff;
        }
    }, [messages]);

    return (
        <div className="messageWrapper">
            <div className="userMessages" ref={scrollContainerRef}>
                <div className="messages">
                    <div ref={topSentinelRef} />

                    {status.loading && (
                        <div className={status.page === 1 ? 'messageLoading' : 'pagination-loader'}>
                            <CircularProgress size={24} />
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <Message
                            key={m._id || i}
                            message={m}
                            own={m.sender._id === user._id}
                            isGroupChat={currentChat?.isGroupChat}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(ChatMessages);
