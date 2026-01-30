import { useState } from 'react';
import RemoveIcon from '../../../Assets/images/closeMinimilistic.png';
import { getProfilePic } from '../../../utils/chatUtils';
import { CircularProgress } from '@mui/material';
import './userlistitem.css';

const UserListItem = ({ user, handleFunction, showUpdateGroupInfo, handleRemoveUser, groupAdmin }) => {

    const [removeUserLoading, setRemoveUserLoading] = useState(false);

    const handleRemove = async () => {
        setRemoveUserLoading(true);
        await handleRemoveUser(user);
        setRemoveUserLoading(false);
    };

    const isAdmin = user.username === groupAdmin;
    const userProfilePic = getProfilePic(user, null);

    return (
        <div className="fetchedUser" onClick={handleFunction}>
            <img className='fetchedUserProfilePic' src={userProfilePic} alt='Profile' />
            <span className='fetchedUserUsername'>{user.username}</span>

            {isAdmin && <span className='isAdmin'>Admin</span>}

            {showUpdateGroupInfo &&
                <div className="crossIcon" onClick={handleRemove}>
                    {removeUserLoading ?
                        <CircularProgress size={24} color="inherit" /> :
                        <img className='removeUserIcon' src={RemoveIcon} alt='' />
                    }
                </div>
            }
        </div>
    )
};

export default UserListItem
