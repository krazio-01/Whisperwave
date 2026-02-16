import { ChatState } from '../../context/ChatProvider';
import deleteIcon from '../../Assets/images/deleteIcon.png';
import profileIcon from '../../Assets/images/profile.png';
import { MdClose } from 'react-icons/md';
import './moreoption.css';

const MoreOption = ({ setShowConfirmModal, setShowMoreOption, setShowProfileInfo }) => {
    const { currentChat, setCurrentChat } = ChatState();

    const hanldeDelete = async () => {
        setShowMoreOption(false);
        setShowConfirmModal(true);
    };

    const handleContactInfo = () => {
        setShowMoreOption(false);
        setShowProfileInfo(true);
    };

    const handleCloseChat = () => {
        setCurrentChat(null);
        setShowProfileInfo(false);
    };

    return (
        <>
            <div className="more" onClick={handleContactInfo}>
                <img src={profileIcon} alt="delete" />
                <span>Contact info</span>
            </div>
            <div className="more" onClick={handleCloseChat}>
                <MdClose style={{ color: 'white' }} />
                <span>Close chat</span>
            </div>
            <div className="more" onClick={hanldeDelete}>
                <img src={deleteIcon} alt="delete" />
                <span id="delete">{currentChat?.isGroupChat ? 'Leave Group' : 'Delete chat'}</span>
            </div>
        </>
    );
};

export default MoreOption;
