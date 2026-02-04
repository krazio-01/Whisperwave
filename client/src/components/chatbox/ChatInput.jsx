import { memo, useState, useRef, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import axios from 'axios';
import { CircularProgress } from '@mui/material';
import FilePreview from '../filePreview/FilePreview';
import emojiPicker from '../../Assets/images/emojiPicker.png';
import fileSelection from '../../Assets/images/fileSelection.png';
import previewClose from '../../Assets/images/previewClose.png';
import sendIcon from '../../Assets/images/send.png';

const BASE_HEIGHT = '4.5rem';

const ChatInput = ({ currentChat, user, socket, setMessages }) => {
    const [newMessage, setNewMessage] = useState('');
    const [msgSendLoading, setMsgSendLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const imagePreviewRef = useRef(null);

    const adjustTextareaHeight = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        textarea.style.height = BASE_HEIGHT;
        const scrollHeight = textarea.scrollHeight;
        const clientHeight = textarea.clientHeight;

        if (scrollHeight > clientHeight) textarea.style.height = `${scrollHeight}px`;
    }, []);

    const handleChange = (e) => {
        setNewMessage(e.target.value);
        adjustTextareaHeight();
    };

    const handleEmojiPick = useCallback(
        (e) => {
            const ref = inputRef.current;
            if (!ref) return;

            ref.focus();
            const emoji = e.native;
            const start = ref.selectionStart;
            const end = ref.selectionEnd;
            const text = ref.value;

            const updatedText = text.substring(0, start) + emoji + text.substring(end);

            setNewMessage(updatedText);

            setTimeout(() => {
                ref.selectionStart = ref.selectionEnd = start + emoji.length;
                adjustTextareaHeight();
            }, 0);
        },
        [adjustTextareaHeight],
    );

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowPreview(true);
        }
        e.target.value = '';
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            const trimmedMessage = newMessage.trim();
            if (!trimmedMessage || !currentChat || msgSendLoading) return;

            setMsgSendLoading(true);

            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.authToken}`,
                    },
                };

                const payload = {
                    text: trimmedMessage,
                    chatId: currentChat._id,
                };

                const { data } = await axios.post('/messages', payload, config);

                setMessages((prev) => [...prev, data]);
                socket.emit('sendMessage', data);

                setNewMessage('');
                setIsPickerVisible(false);
                if (inputRef.current) inputRef.current.style.height = BASE_HEIGHT;
            } catch (err) {
                console.error('Error sending message:', err.message);
            } finally {
                setMsgSendLoading(false);
            }
        },
        [newMessage, currentChat, user.authToken, socket, setMessages, msgSendLoading],
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const isSendDisabled = msgSendLoading || (!newMessage.trim() && !selectedFile);

    return (
        <div className="chatBoxBottom">
            <div className="chatBoxbottomWrapper">
                <div className="input-container">
                    <button
                        type="button"
                        className="emoji-trigger"
                        onClick={() => setIsPickerVisible((prev) => !prev)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <img className="emoji" src={emojiPicker} alt="Open Emoji Picker" />
                    </button>

                    <CSSTransition
                        in={isPickerVisible}
                        timeout={200}
                        classNames="emojiPicker"
                        unmountOnExit
                        nodeRef={pickerRef}
                    >
                        <div className="emojiPicker-wrapper" ref={pickerRef}>
                            <Picker data={data} previewPosition="none" emojiSize={20} onEmojiSelect={handleEmojiPick} />
                        </div>
                    </CSSTransition>

                    <textarea
                        ref={inputRef}
                        className="chatMessageInput"
                        placeholder="Message"
                        onKeyDown={handleKeyDown}
                        onChange={handleChange}
                        value={newMessage}
                        autoComplete="off"
                        rows={1}
                        style={{ height: BASE_HEIGHT, resize: 'none' }}
                    />

                    <div>
                        <input
                            style={{ display: 'none' }}
                            className="file-select"
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file">
                            <img className="file" src={fileSelection} alt="File Selection" />
                        </label>

                        <CSSTransition
                            in={showPreview}
                            timeout={250}
                            classNames="imaageTransition"
                            unmountOnExit
                            nodeRef={imagePreviewRef}
                        >
                            <div className="imagePreview" ref={imagePreviewRef}>
                                <FilePreview
                                    previewClose={previewClose}
                                    selectedFile={selectedFile}
                                    setSelectedFile={setSelectedFile}
                                    setShowPreview={() => setShowPreview(false)}
                                    socket={socket}
                                    sendIcon={sendIcon}
                                    setMessages={setMessages}
                                />
                            </div>
                        </CSSTransition>
                    </div>
                </div>

                <button
                    className="chatSendBtn"
                    onClick={handleSubmit}
                    disabled={isSendDisabled}
                    style={{ opacity: isSendDisabled ? 0.6 : 1, cursor: isSendDisabled ? 'default' : 'pointer' }}
                >
                    {msgSendLoading ? (
                        <CircularProgress size={28} color="primary" />
                    ) : (
                        <img src={sendIcon} alt="Send" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default memo(ChatInput);
