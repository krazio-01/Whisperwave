import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChatState } from '../../../context/ChatProvider';
import UpdateGroupInfo from '../../updateGroupInfo/UpdateGroupInfo';
import { getProfilePic } from '../../../utils/chatUtils';
import './profile.css';
import backBtn from '../../../Assets/images/backBtn.png';
import UserListItem from '../userListItem/UserListItem';
import EditIcon from '../../../Assets/images/edit.png';
import { toast } from 'react-toastify';

const Profile = ({ style, currentUI, setCurrentUI, setShowProfileInfo, fetchAgain, setFetchAgain }) => {
    const { user, setUser, currentChat } = ChatState();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        pic: null,
        preview: null,
    });
    const [otp, setOtp] = useState('');
    const [uiState, setUiState] = useState({
        isEditing: false,
        loading: false,
        showAddOrRemoveControls: false,
        showOtpUI: false,
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                username: user.username,
                email: user.email,
                preview: user.profilePicture,
            }));
        }
    }, [user]);

    const groupAdmin = currentChat?.groupAdmin?.username;
    const chatUserProfilePic = getProfilePic(user, currentChat);
    const userProfilePic = getProfilePic(user, null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                pic: file,
                preview: URL.createObjectURL(file),
            }));
            if (!uiState.isEditing) {
                setUiState((prev) => ({ ...prev, isEditing: true }));
            }
        }
    };

    const handleUpdateProfile = async () => {
        setUiState((prev) => ({ ...prev, loading: true }));
        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('email', formData.email);
            if (formData.pic) data.append('profilePicture', formData.pic);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            const response = await axios.put('/users/update', data, config);

            if (response.data.otpSent) {
                setUiState((prev) => ({
                    ...prev,
                    loading: false,
                    showOtpUI: true,
                }));
                toast.info(`Verification code sent to ${formData.email}`);
            } else {
                const updatedUser = { ...user, ...response.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setUiState((prev) => ({ ...prev, isEditing: false, loading: false }));
                toast.success('Profile Updated!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setUiState((prev) => ({ ...prev, loading: false }));
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const verifyOtpAndSave = async () => {
        if (!otp) return toast.warning('Please enter the code');

        setUiState((prev) => ({ ...prev, loading: true }));
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.authToken}` },
            };

            const response = await axios.post('/users/verify-email-change', { otp }, config);

            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            setUiState({ isEditing: false, loading: false, showOtpUI: false, showAddOrRemoveControls: false });
            setOtp('');
            toast.success('Email verified and profile updated!');
        } catch (error) {
            setUiState((prev) => ({ ...prev, loading: false }));
            toast.error(error.response?.data?.message || 'Invalid Code');
        }
    };

    return (
        <div className="profile-container" style={style}>
            {currentUI === 'profile' ? (
                <div className="profile-wrapper">
                    <div className="infoTop">
                        <div className="header-left">
                            <img
                                className="backButtonMessage"
                                src={backBtn}
                                alt="Back"
                                onClick={() => setCurrentUI('chat')}
                            />
                            <span className="header-title">{uiState.isEditing ? 'Edit Profile' : 'Profile'}</span>
                        </div>

                        {uiState.isEditing && !uiState.showOtpUI && (
                            <button onClick={handleUpdateProfile} disabled={uiState.loading} className="btn-save">
                                {uiState.loading ? 'Processing...' : 'Save'}
                            </button>
                        )}
                    </div>

                    <div className="infoProfilePic">
                        <div className="img-wrapper">
                            <img
                                src={formData.preview || userProfilePic}
                                alt="Profile"
                                className={uiState.isEditing ? 'img-editing' : ''}
                            />

                            <div className="img-overlay" onClick={() => fileInputRef.current.click()}>
                                <img src={EditIcon} alt="Upload" />
                                <span>Change</span>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="profileDetails">
                        {uiState.showOtpUI ? (
                            <div className="edit-form fade-in">
                                <p className="otp-instruction">
                                    We've sent a code to <strong>{formData.email}</strong>. Please enter it below to
                                    confirm your changes.
                                </p>
                                <div className="input-group">
                                    <label>Verification Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter OTP"
                                        className="otp-input"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    className="otp-verify-bn"
                                    onClick={verifyOtpAndSave}
                                    disabled={uiState.loading}
                                >
                                    {uiState.loading ? 'Verifying...' : 'Confirm & Update'}
                                </button>
                                <button
                                    className="btn-cancel"
                                    onClick={() => setUiState((prev) => ({ ...prev, showOtpUI: false }))}
                                >
                                    Back
                                </button>
                            </div>
                        ) : uiState.isEditing ? (
                            <div className="edit-form">
                                <div className="input-group">
                                    <label>Username</label>
                                    <input
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Enter username"
                                        disabled={uiState.loading}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter email"
                                        disabled={uiState.loading}
                                    />
                                </div>
                                <button
                                    className="btn-cancel"
                                    onClick={() => {
                                        setUiState((prev) => ({ ...prev, isEditing: false }));
                                        setFormData((prev) => ({
                                            ...prev,
                                            username: user.username,
                                            email: user.email,
                                            preview: user.profilePicture,
                                        }));
                                    }}
                                    disabled={uiState.loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="read-only-details">
                                <div className="detail-item">
                                    <span className="label">Username</span>
                                    <div className="value-row">
                                        <span className="value">{user?.username}</span>
                                        <img
                                            src={EditIcon}
                                            alt="Edit"
                                            onClick={() => setUiState((prev) => ({ ...prev, isEditing: true }))}
                                        />
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Email</span>
                                    <div className="value-row">
                                        <span className="value">{user?.email}</span>
                                        <img
                                            src={EditIcon}
                                            alt="Edit"
                                            onClick={() => setUiState((prev) => ({ ...prev, isEditing: true }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="chatGroupOrUserInfo">
                    {!uiState.showAddOrRemoveControls ? (
                        <>
                            <div className="infoTop">
                                <div className="header-left">
                                    <img
                                        className="backButtonMessage"
                                        src={backBtn}
                                        alt="Back"
                                        onClick={() => setShowProfileInfo(false)}
                                    />
                                    <span className="header-title">
                                        {currentChat?.isGroupChat ? 'Group Info' : 'User Info'}
                                    </span>
                                </div>
                                {currentChat?.isGroupChat && (
                                    <img
                                        className="editIcon"
                                        src={EditIcon}
                                        alt="Edit"
                                        onClick={() =>
                                            setUiState((prev) => ({
                                                ...prev,
                                                showAddOrRemoveControls: !prev.showAddOrRemoveControls,
                                            }))
                                        }
                                    />
                                )}
                            </div>

                            <div className="infoProfilePic">
                                <div className="img-wrapper">
                                    <img src={chatUserProfilePic} alt="" />
                                </div>
                            </div>

                            <div className="profileDetails">
                                {currentChat?.isGroupChat ? (
                                    <>
                                        <span className="group-name">{currentChat?.chatName}</span>
                                        <div className="userList">
                                            <span>Group members</span>
                                            {currentChat?.members.map((u) => (
                                                <UserListItem key={u._id} user={u} groupAdmin={groupAdmin} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <span className="other-user">
                                        {currentChat?.members.find((m) => m._id !== user._id)?.username}
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <UpdateGroupInfo
                            showAddOrRemoveConrols={uiState.showAddOrRemoveControls}
                            setShowAddOrRemoveConrols={(val) =>
                                setUiState((prev) => ({ ...prev, showAddOrRemoveControls: val }))
                            }
                            fetchAgain={fetchAgain}
                            setFetchAgain={setFetchAgain}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;
