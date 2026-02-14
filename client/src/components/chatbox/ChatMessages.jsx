import { memo, useEffect, useRef, useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Message from '../message/Message';
import EmptyState from '../miscellaneous/emptyState/EmptyState';

const ChatMessages = ({ currentChat, user, socket, messages, setMessages, typingUsers }) => {
    const [status, setStatus] = useState({
        loading: false,
        hasMore: false,
        page: 1,
    });

    const scrollContainerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const observerRef = useRef(null);
    const chatMeta = useRef({
        prevHeight: 0,
        isInitialLoad: true,
        isPagination: false,
    });

    const typingMembers = useMemo(() => {
        if (!currentChat?.members || !typingUsers) return [];
        return currentChat.members.filter((m) => typingUsers.includes(m._id));
    }, [currentChat?.members, typingUsers]);

    const fetchMessages = useCallback(
        async (pageNum, chatId, signal) => {
            try {
                const { data } = await axios.get(`/messages/${chatId}`, {
                    headers: { Authorization: `Bearer ${user.authToken}` },
                    params: { page: pageNum, limit: 20 },
                    signal: signal,
                });
                return data;
            } catch (error) {
                if (axios.isCancel(error)) return null;
                console.error('Fetch error:', error);
                throw error;
            }
        },
        [user.authToken],
    );

    useEffect(() => {
        const controller = new AbortController();
        const chatId = currentChat._id;

        setMessages([]);
        setStatus({ loading: true, hasMore: false, page: 1 });
        chatMeta.current = { prevHeight: 0, isInitialLoad: true, isPagination: false };

        const loadInitial = async () => {
            try {
                const data = await fetchMessages(1, chatId, controller.signal);
                if (data) {
                    setMessages(data.messages);
                    setStatus({ loading: false, hasMore: data.hasMore, page: 1 });
                }
                socket.emit('chat:join', chatId);
            } catch (e) {
                setStatus((prev) => ({ ...prev, loading: false }));
            }
        };

        loadInitial();

        return () => {
            controller.abort();
            socket.emit('chat:leave', chatId);
        };
    }, [currentChat._id, fetchMessages, setMessages, socket]);

    const handleLoadMore = useCallback(async () => {
        if (status.loading || !status.hasMore) return;

        setStatus((prev) => ({ ...prev, loading: true }));

        if (scrollContainerRef.current) {
            chatMeta.current.prevHeight = scrollContainerRef.current.scrollHeight;
            chatMeta.current.isInitialLoad = false;
            chatMeta.current.isPagination = true;
        }

        try {
            const nextPage = status.page + 1;
            const data = await fetchMessages(nextPage, currentChat._id);

            if (data) {
                setMessages((prev) => [...data.messages, ...prev]);
                setStatus((prev) => ({
                    ...prev,
                    hasMore: data.hasMore,
                    loading: false,
                    page: nextPage,
                }));
            }
        } catch (error) {
            setStatus((prev) => ({ ...prev, loading: false }));
        }
    }, [status.loading, status.hasMore, status.page, currentChat._id, fetchMessages, setMessages]);

    useEffect(() => {
        const currentSentinel = topSentinelRef.current;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) handleLoadMore();
            },
            { root: scrollContainerRef.current, threshold: 0.5 },
        );

        if (currentSentinel) observerRef.current.observe(currentSentinel);
        return () => observerRef.current?.disconnect();
    }, [handleLoadMore]);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (chatMeta.current.isInitialLoad) container.scrollTop = container.scrollHeight;
        else if (chatMeta.current.isPagination && chatMeta.current.prevHeight > 0) {
            const newHeight = container.scrollHeight;
            const heightDiff = newHeight - chatMeta.current.prevHeight;
            container.scrollTop = heightDiff;

            chatMeta.current.prevHeight = 0;
            chatMeta.current.isPagination = false;
        } else {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, typingUsers]);

    return (
        <div className="messageWrapper">
            <div className="userMessages" ref={scrollContainerRef}>
                <div className="messages">
                    {status.hasMore && <div ref={topSentinelRef} style={{ height: '10px' }} />}

                    {status.loading && messages.length && status.hasMore && (
                        <div className="pagination-loader">
                            <CircularProgress size={30} />
                        </div>
                    )}

                    {status.loading && !messages.length && (
                        <div className="messageLoading">
                            <CircularProgress size={40} />
                        </div>
                    )}

                    {!status.loading && status.page === 1 && !messages.length && (
                        <div className="noMessages">
                            <EmptyState
                                src="./animations/greet.lottie"
                                title={
                                    'Say Hi to ' +
                                    (currentChat?.isGroupChat
                                        ? 'the group'
                                        : currentChat?.members.find((u) => u._id !== user._id)?.username)
                                }
                                description="Break the ice and start the conversation."
                                animationStyle={{ filter: 'invert(1)' }}
                            />
                        </div>
                    )}

                    <TransitionGroup className="transition-group">
                        {messages.map((m, i) => (
                            <CSSTransition
                                key={m._id || `msg-${i}`}
                                timeout={chatMeta.current.isInitialLoad ? 0 : 300}
                                classNames="message-item"
                                unmountOnExit
                            >
                                <Message
                                    message={m}
                                    own={m.sender._id === user._id}
                                    chatId={currentChat?._id}
                                    isGroupChat={currentChat?.isGroupChat}
                                />
                            </CSSTransition>
                        ))}

                        {typingMembers.length > 0 && (
                            <CSSTransition key="typing-indicator" timeout={300} classNames="message-item" unmountOnExit>
                                <Message typing={true} typingMembers={typingMembers} own={false} />
                            </CSSTransition>
                        )}
                    </TransitionGroup>
                </div>
            </div>
        </div>
    );
};

export default memo(ChatMessages);
