import { memo, useState, useRef, useMemo } from 'react';
import { CSSTransition } from 'react-transition-group';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { MdVideoCall, MdCall } from 'react-icons/md';
import MoreOption from '../moreOption/MoreOption';
import { IoIosArrowBack } from 'react-icons/io';
import dotsIcon from '../../Assets/images/dots.png';
import useClickOutside from '../../hooks/useClickOutside';
import ConfirmModal from '../confimModal/ConfirmModal';
import { toast } from 'react-toastify';
import axios from 'axios';

const ChatHeader = ({
    user,
    currentChat,
    setCurrentChat,
    isUserOnline,
    handleStartCall,
    setFetchAgain,
    setShowProfileInfo,
    setMessages,
}) => {
    const [showMoreOption, setShowMoreOption] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const threeDotsRef = useRef(null);
    const optionsContainerRef = useRef(null);

    const chatUserProfilePic = useMemo(() => getProfilePic(user, currentChat), [user, currentChat]);
    const currentChatName = useMemo(() => getCurrentChatName(user, currentChat), [user, currentChat]);

    useClickOutside(optionsContainerRef, () => setShowMoreOption(false));

    const executeChatDeletion = async () => {
        const { _id: chatId, isGroupChat } = currentChat;

        const route = isGroupChat ? '/chat/leave' : '/chat/deleteChat';
        const method = isGroupChat ? 'PUT' : 'DELETE';
        const data = isGroupChat ? { chatId, userId: user._id } : { chatId };
        const successMsg = isGroupChat ? 'Left Group Successfully' : 'Chat Deleted Successfully';

        try {
            await axios({
                method,
                url: route,
                data,
                headers: { Authorization: `Bearer ${user.authToken}` },
            });

            toast.success(successMsg);
            setCurrentChat(null);
            setShowConfirmModal(false);
            setFetchAgain((prev) => !prev);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error Occurred');
            throw error;
        }
    };

    const renderStatus = () => {
        if (currentChat.isGroupChat) {
            return <div className="numberOfMembers">{currentChat.members.length} Members</div>;
        }

        return (
            <div className="statusForPrivateChats">
                <div className="color" style={{ backgroundColor: isUserOnline ? '#2ecc71' : '#e74c3c' }} />
                <span className="userStatus">{isUserOnline ? 'Online' : 'Offline'}</span>
            </div>
        );
    };

    return (
        <div className="chatBoxTop">
            <div className="left-section">
                <div className="closeConversation" onClick={() => setCurrentChat(null)}>
                    <IoIosArrowBack />
                </div>
                <div className="details-wrapper" onClick={() => setShowProfileInfo((prev) => !prev)}>
                    <img className="userImg" src={chatUserProfilePic} alt="User" />
                    <div className="userDetails">
                        <span className="userName">{currentChatName}</span>
                        <div className="status">{renderStatus()}</div>
                    </div>
                </div>
            </div>

            <div className="right-section">
                {!currentChat.isGroupChat && (
                    <div className="call-actions">
                        <button onClick={() => handleStartCall('video')}>
                            <MdVideoCall size={24} />
                        </button>
                        <button onClick={() => handleStartCall('audio')}>
                            <MdCall size={22} />
                        </button>
                    </div>
                )}

                <div className="threeDotsContainer" ref={optionsContainerRef}>
                    <div className="threeDots" onClick={() => setShowMoreOption((prev) => !prev)}>
                        <img src={dotsIcon} alt="Dots" />
                    </div>
                    <CSSTransition
                        in={showMoreOption}
                        timeout={250}
                        classNames="moreOptions"
                        unmountOnExit
                        nodeRef={threeDotsRef}
                    >
                        <div className="moreOptionDropdown" ref={threeDotsRef}>
                            <MoreOption
                                setShowConfirmModal={setShowConfirmModal}
                                setShowMoreOption={setShowMoreOption}
                                setShowProfileInfo={setShowProfileInfo}
                                setMessages={setMessages}
                            />
                        </div>
                    </CSSTransition>
                </div>
            </div>

            {showConfirmModal && (
                <ConfirmModal
                    message={
                        currentChat?.isGroupChat
                            ? `Are you sure you want to leave "${currentChat?.chatName}"?`
                            : 'Are you sure you want to delete this conversation?'
                    }
                    onConfirm={executeChatDeletion}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
};

export default memo(ChatHeader);
