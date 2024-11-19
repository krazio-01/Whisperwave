import React from 'react';
import './moreoption.css';
import { ChatState } from '../../context/ChatProvider';
import deleteIcon from '../../Assets/images/deleteIcon.png';
import profileIcon from '../../Assets/images/profile.png';

const MoreOption = ({ setShowConfirmModal, setShowMoreOption, setShowProfileInfo }) => {
  const { currentChat } = ChatState();

  const hanldeDelete = async () => {
    setShowMoreOption(false);
    setShowConfirmModal(true);
  };

  const handleContactInfo = () => {
    setShowMoreOption(false);
    setShowProfileInfo(true);
  };

  return (
    <>
      <div className='more' onClick={handleContactInfo}>
        <img src={profileIcon} alt="delete" />
        <span>Contact info</span>
      </div>
      <div className="more" onClick={hanldeDelete}>
        <img src={deleteIcon} alt="delete" />
        <span id='delete'>{currentChat?.isGroupChat ? 'Leave Group' : 'Delete chat'}</span>
      </div>

    </>
  )
}

export default MoreOption
