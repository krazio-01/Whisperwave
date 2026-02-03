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

const ChatInput = ({ currentChat, user, socket, setMessages }) => {
    const [newMessages, setNewMessages] = useState('');
    const [textareaHeight, setTextareaHeight] = useState('4.5rem');
    const [msgSendLoading, setMsgSendLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const imagePreviewRef = useRef(null);

    const handleInput = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        textarea.style.height = '4.5rem';
        const { scrollHeight, clientHeight } = textarea;

        if (scrollHeight > clientHeight) {
            const newHeight = `${scrollHeight}px`;
            textarea.style.height = newHeight;
            setTextareaHeight(newHeight);
        } else {
            setTextareaHeight(`${clientHeight}px`);
        }
    }, []);

    const handleEmojiPick = useCallback((e) => {
        const ref = inputRef.current;
        if (ref) ref.focus();

        setNewMessages((prev) => {
            if (!ref) return prev + e.native;
            const start = prev.substring(0, ref.selectionStart);
            const end = prev.substring(ref.selectionStart);
            return start + e.native + end;
        });
    }, []);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowPreview(true);
        }
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            if (e) e.preventDefault();
            if (!newMessages.trim() || !currentChat) return;

            setMsgSendLoading(true);
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.authToken}`,
                    },
                };

                const messagePayload = {
                    text: newMessages,
                    chatId: currentChat._id,
                };

                const { data } = await axios.post('/messages', messagePayload, config);

                setMessages((prev) => [...prev, data]);

                socket.emit('sendMessage', data);
                setNewMessages('');
                setTextareaHeight('4.5rem');
                setIsPickerVisible(false);
            } catch (err) {
                console.error('Error sending message:', err.message);
            } finally {
                setMsgSendLoading(false);
            }
        },
        [newMessages, currentChat, user.authToken, socket, setMessages],
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chatBoxBottom">
            <div className="chatBoxbottomWrapper">
                <div className="input">
                    <img
                        className="emoji"
                        src={emojiPicker}
                        alt="Emoji Picker"
                        onClick={() => setIsPickerVisible(!isPickerVisible)}
                    />
                    <CSSTransition
                        in={isPickerVisible}
                        timeout={200}
                        classNames="emojiPicker"
                        unmountOnExit
                        nodeRef={pickerRef}
                    >
                        <div className="emojiPicker" ref={pickerRef}>
                            <Picker
                                data={data}
                                previewPosition="none"
                                emojiSize={20}
                                style={{ height: '20px' }}
                                onEmojiSelect={handleEmojiPick}
                            />
                        </div>
                    </CSSTransition>

                    <textarea
                        className="chatMessageInput"
                        placeholder="Message"
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        onInput={handleInput}
                        onChange={(e) => setNewMessages(e.target.value)}
                        value={newMessages}
                        style={{ '--textarea-height': textareaHeight }}
                    />

                    <div>
                        <input
                            className="file-select"
                            style={{ display: 'none' }}
                            type="file"
                            id="file"
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

                <button className="chatSendBtn" onClick={handleSubmit} disabled={msgSendLoading}>
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
