import { ChatState } from '../../context/ChatProvider';
import { MdClose, MdDelete, MdExitToApp } from 'react-icons/md';
import profileIcon from '../../Assets/images/profile.png';
import './moreoption.css';

const MoreOption = ({ setShowConfirmModal, setShowMoreOption, setShowProfileInfo, setMessages }) => {
    const { currentChat, setCurrentChat } = ChatState();

    const handleDelete = () => {
        setShowMoreOption(false);
        setShowConfirmModal(true);
    };

    const handleContactInfo = () => {
        setShowMoreOption(false);
        setShowProfileInfo(true);
    };

    const handleCloseChat = () => {
        setShowMoreOption(false);
        setMessages([]);
        setShowProfileInfo(false);
        setCurrentChat(null);
    };

    const menuItems = [
        {
            id: 'contact',
            label: 'Contact info',
            icon: profileIcon,
            action: handleContactInfo,
        },
        {
            id: 'close',
            label: 'Close chat',
            icon: MdClose,
            action: handleCloseChat,
        },
        {
            id: 'delete',
            label: currentChat?.isGroupChat ? 'Leave Group' : 'Delete chat',
            icon: currentChat?.isGroupChat ? MdExitToApp : MdDelete,
            action: handleDelete,
            className: 'delete-btn',
        },
    ];

    return (
        <div className="more-options-container">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`more-item ${item.className || ''}`}
                    onClick={item.action}
                    aria-label={item.label}
                >
                    {item.id === 'contact' ? <img src={item.icon} /> : <item.icon className="icon" />}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default MoreOption;
