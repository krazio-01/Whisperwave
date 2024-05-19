import React from 'react';
import { useState } from 'react';
import './message.css';
import moment from 'moment';
import { getChatImages } from '../../utils/chatUtils';

const Message = (props) => {
  // desturctructuring props
  const { message, own, userProfilepic, chatUserProfilePic } = props;

  const [viewImage, setViewImage] = useState(false);

  const messageImg = getChatImages(message);

  const handleImageClick = () => {
    setViewImage(!viewImage);
  };

  return (
    <div>
      <div className={own ? "message own" : "message"}>
        <div className="messageTop">
          <img className='messageUserImg' src={own === true ? userProfilepic : chatUserProfilePic} alt='User' />
          {messageImg ?
            <div className="msgWithImg">
              <img
                className='messageImg'
                src={messageImg}
                alt='User'
                onClick={handleImageClick}
              />
              {message.text && <p className='msgWithImgText'>{message.text}</p>}
            </div>
            : <p className='messageText'>{message.text}</p>}
        </div>
        <div className="messageBottom">
          {moment(message.createdAt).fromNow()}
        </div>
      </div>

      {viewImage &&
        <div className="fullscreenImage">
          <span className="closeIcon" onClick={handleImageClick}>
            &times;
          </span>
          <img className="fullscreenImageImg" src={messageImg} alt='User' />
        </div>}
    </div>
  )
}

export default Message
