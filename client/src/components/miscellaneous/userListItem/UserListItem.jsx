import { useState } from 'react';
import { getProfilePic } from '../../../utils/chatUtils';
import { CircularProgress } from '@mui/material';
import { IoRemove } from "react-icons/io5";
import { MdPersonAddAlt1 } from "react-icons/md";
import './userlistitem.css';

const UserListItem = ({ user, handleAddUser, showAddOrRemoveConrols, handleRemoveUser, groupAdmin, isChatMember }) => {
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [removeUserLoading, setRemoveUserLoading] = useState(false);

    const handleRemove = async () => {
        setRemoveUserLoading(true);
        await handleRemoveUser(user);
        setRemoveUserLoading(false);
    };

    const handleAdd = async () => {
        setAddUserLoading(true);
        await handleAddUser(user);
        setAddUserLoading(false);
    };

    const isAdmin = user.username === groupAdmin;
    const userProfilePic = getProfilePic(user, null);

    return (
        <div className="list-item-container">
            <div className="info-wrapper">
                <div className="meta-info">
                    <img className="user-profile" src={userProfilePic} alt="Profile" />
                    <div>
                        <span className="username">{user.username}</span>
                        {isChatMember && <p>Already added to group</p>}
                    </div>
                </div>

                {isAdmin && <span className="isAdmin">Admin</span>}

                {showAddOrRemoveConrols && (
                    <div className='actions-container'>
                        <div className="addIcon" onClick={handleAdd}>
                            {addUserLoading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <MdPersonAddAlt1 />
                            )}
                        </div>

                        {
                            isChatMember && <div className="removeIcon" onClick={handleRemove}>
                                {removeUserLoading ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <IoRemove />
                                )}
                            </div>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserListItem;
