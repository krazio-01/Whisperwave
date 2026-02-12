import { memo, useState, useRef, useMemo } from 'react';
import { CSSTransition } from 'react-transition-group';
import { getProfilePic, getCurrentChatName } from '../../utils/chatUtils';
import { MdVideoCall, MdCall } from 'react-icons/md';
import MoreOption from '../moreOption/MoreOption';
import BackIcon from '../../Assets/images/back.png';
import dotsIcon from '../../Assets/images/dots.png';

const ChatHeader = ({
    user,
    currentChat,
    setCurrentChat,
    isUserOnline,
    handleStartCall,
    fetchAgain,
    setShowConfirmModal,
    setShowProfileInfo,
    showProfileInfo,
}) => {
    const [showMoreOption, setShowMoreOption] = useState(false);

    const threeDotsRef = useRef(null);

    const chatUserProfilePic = useMemo(() => getProfilePic(user, currentChat), [user, currentChat]);
    const currentChatName = useMemo(() => getCurrentChatName(user, currentChat), [user, currentChat]);

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
                    <img src={BackIcon} alt="Back" />
                </div>
                <div className='details-wrapper' onClick={() => setShowProfileInfo((prev) => !prev)}>
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

                <div className="threeDotsContainer">
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
                                fetchAgain={fetchAgain}
                                setShowConfirmModal={setShowConfirmModal}
                                setShowMoreOption={setShowMoreOption}
                                setShowProfileInfo={setShowProfileInfo}
                                showProfileInfo={showProfileInfo}
                            />
                        </div>
                    </CSSTransition>
                </div>
            </div>
        </div>
    );
};

export default memo(ChatHeader);
