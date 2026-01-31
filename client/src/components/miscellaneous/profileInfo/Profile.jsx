import { useState } from 'react';
import { ChatState } from '../../../context/ChatProvider';
import UpdateGroupInfo from '../../updateGroupInfo/UpdateGroupInfo';
import { getProfilePic } from '../../../utils/chatUtils';
import './profile.css';
import backBtn from '../../../Assets/images/backBtn.png';
import UserListItem from '../userListItem/UserListItem';
import EditIcon from '../../../Assets/images/edit.png';

const Profile = ({ style, currentUI, setCurrentUI, setShowProfileInfo, fetchAgain, setFetchAgain }) => {
    const { user, currentChat } = ChatState();
    const [showAddOrRemoveConrols, setShowAddOrRemoveConrols] = useState(false);
    const groupAdmin = currentChat?.groupAdmin?.username;

    const chatUserProfilePic = getProfilePic(user, currentChat);
    const userProfilePic = getProfilePic(user, null);

    return (
        <div className="userOrGroupInfo" style={style}>
            {currentUI === 'profile' ? (
                <>
                    <div className="infoTop">
                        <img
                            className="backButtonMessage"
                            src={backBtn}
                            alt="Back"
                            onClick={() => {
                                setCurrentUI('chat');
                            }}
                        />
                        <span>{currentChat?.isGroupChat ? 'Group Info' : 'User Info'}</span>
                    </div>

                    <div className="infoProfilePic">
                        <img src={userProfilePic} alt="" />
                    </div>

                    <div className="profileDetails">
                        <span>{user?.username}</span>
                        <span>{user?.email}</span>
                    </div>
                </>
            ) : (
                <>
                    {!showAddOrRemoveConrols ? (
                        <>
                            <div className="infoTop">
                                <img
                                    className="backButtonMessage"
                                    src={backBtn}
                                    alt="Back"
                                    onClick={() => {
                                        setShowProfileInfo(false);
                                    }}
                                />
                                <span>{currentChat?.isGroupChat ? 'Group Info' : 'User Info'}</span>
                                {currentChat?.isGroupChat && (
                                    <img
                                        className="editIcon"
                                        src={EditIcon}
                                        alt="Edit"
                                        onClick={() => {
                                            setShowAddOrRemoveConrols(!showAddOrRemoveConrols);
                                        }}
                                    />
                                )}
                            </div>

                            <div className="infoProfilePic">
                                <img src={chatUserProfilePic} alt="" />
                            </div>

                            <div className="profileDetails">
                                {currentChat?.isGroupChat ? (
                                    <>
                                        <span>{currentChat?.chatName}</span>
                                        <div className="userList">
                                            <span>Group members</span>
                                            {currentChat?.members.map((user) => (
                                                <UserListItem key={user._id} user={user} groupAdmin={groupAdmin} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span>{currentChat?.members.find((m) => m._id !== user._id)?.username}</span>
                                        <span>{currentChat?.members.find((m) => m._id !== user._id)?.email}</span>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <UpdateGroupInfo
                            showAddOrRemoveConrols={showAddOrRemoveConrols}
                            setShowAddOrRemoveConrols={setShowAddOrRemoveConrols}
                            fetchAgain={fetchAgain}
                            setFetchAgain={setFetchAgain}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default Profile;
