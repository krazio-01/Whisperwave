import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChatState } from '../../../context/ChatProvider';
import { getProfilePic } from '../../../utils/chatUtils';
import UpdateGroupInfo from '../../updateGroupInfo/UpdateGroupInfo';
import UserListItem from '../userListItem/UserListItem';
import backBtn from '../../../Assets/images/backBtn.png';
import EditIcon from '../../../Assets/images/edit.png';
import './profile.css';

const MyProfile = memo(({ style, onBack }) => {
    const { user, setUser } = ChatState();
    const [mode, setMode] = useState('VIEW');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        pic: null,
        preview: null,
    });
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (user && mode === 'VIEW') resetForm();
    }, [user, mode]);

    useEffect(() => {
        return () => {
            if (formData.preview && formData.preview !== user?.profilePicture) URL.revokeObjectURL(formData.preview);
        };
    }, [formData.preview, user]);

    const resetForm = () => {
        setFormData({
            username: user?.username || '',
            email: user?.email || '',
            pic: null,
            preview: user?.profilePicture,
        });
        setOtp('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                pic: file,
                preview: URL.createObjectURL(file),
            }));
            setMode('EDIT');
        }
    };

    const getAuthConfig = () => ({
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.authToken}`,
        },
    });

    const updateLocalUser = (newData) => {
        const updatedUser = { ...user, ...newData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const handleSaveProfile = async () => {
        if (!formData.username || !formData.email) return toast.warning('Fields cannot be empty');

        setLoading(true);
        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('email', formData.email);
            if (formData.pic) data.append('profilePicture', formData.pic);

            const response = await axios.put('/users/update', data, getAuthConfig());

            if (response.data.otpSent) {
                setMode('OTP');
                toast.info(`Verification code sent to ${formData.email}`);
            } else {
                updateLocalUser(response.data);
                toast.success('Profile Updated!');
                setMode('VIEW');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return toast.warning('Enter code');
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.authToken}` } };
            const response = await axios.post('/users/verify-email-change', { otp }, config);

            updateLocalUser(response.data);
            toast.success('Email Verified & Profile Updated!');
            setMode('VIEW');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid Code');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setMode('VIEW');
    };

    return (
        <div className="profile-wrapper" style={style}>
            <div className="infoTop">
                <div className="header-left">
                    <img className="backButtonMessage" src={backBtn} alt="Back" onClick={onBack} />
                    <span className="header-title">
                        {mode === 'EDIT' ? 'Edit Profile' : mode === 'OTP' ? 'Verify Email' : 'Profile'}
                    </span>
                </div>
                {mode === 'EDIT' && (
                    <button onClick={handleSaveProfile} disabled={loading} className="btn-save">
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>

            <div className="infoProfilePic">
                <div className="img-wrapper">
                    <img
                        src={formData.preview || getProfilePic(user, null)}
                        alt="Profile"
                        className={mode === 'EDIT' ? 'img-editing' : ''}
                    />
                    <div className="img-overlay" onClick={() => fileInputRef.current.click()}>
                        <img src={EditIcon} alt="Change" />
                        <span>Change</span>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            <div className="profileDetails">
                {mode === 'OTP' ? (
                    <div className="edit-form fade-in">
                        <p className="otp-instruction">
                            Code sent to <strong>{formData.email}</strong>
                        </p>
                        <div className="input-group">
                            <label>Verification Code</label>
                            <input
                                className="otp-input"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                            />
                        </div>
                        <button className="otp-verify-bn" onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? 'Verifying...' : 'Confirm'}
                        </button>
                        <button className="btn-cancel" onClick={() => setMode('EDIT')}>
                            Back
                        </button>
                    </div>
                ) : mode === 'EDIT' ? (
                    <div className="edit-form">
                        <div className="input-group">
                            <label>Username</label>
                            <input
                                name="username"
                                disabled={loading}
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                name="email"
                                disabled={loading}
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button className="btn-cancel" disabled={loading} onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="read-only-details">
                        {['username', 'email'].map((field) => (
                            <div className="detail-item" key={field}>
                                <span className="label">{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                                <div className="value-row">
                                    <span className="value">{user?.[field]}</span>
                                    <img src={EditIcon} alt="Edit" onClick={() => setMode('EDIT')} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

const ChatInfo = memo(({ currentChat, user, onBack, fetchAgain, setFetchAgain }) => {
    const [showEditGroup, setShowEditGroup] = useState(false);

    const isGroup = currentChat?.isGroupChat;

    const chatImage = useMemo(() => getProfilePic(user, currentChat), [user, currentChat]);

    const peerName = useMemo(() => {
        if (isGroup) return null;
        return currentChat?.members.find((m) => m._id !== user._id)?.username;
    }, [currentChat, isGroup, user._id]);

    if (showEditGroup) {
        return (
            <div className="chatGroupOrUserInfo">
                <UpdateGroupInfo
                    showAddOrRemoveConrols={showEditGroup}
                    setShowAddOrRemoveConrols={setShowEditGroup}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                />
            </div>
        );
    }

    return (
        <div className="chatGroupOrUserInfo">
            <div className="infoTop">
                <div className="header-left">
                    <img className="backButtonMessage" src={backBtn} alt="Back" onClick={onBack} />
                    <span className="header-title">{isGroup ? 'Group Info' : 'User Info'}</span>
                </div>
                {isGroup && (
                    <img className="editIcon" src={EditIcon} alt="Edit Group" onClick={() => setShowEditGroup(true)} />
                )}
            </div>

            <div className="infoProfilePic">
                <div className="img-wrapper">
                    <img src={chatImage} alt="Chat Profile" />
                </div>
            </div>

            <div className="profileDetails">
                {isGroup ? (
                    <>
                        <span className="group-name">{currentChat?.chatName}</span>
                        <div className="userList">
                            <span>Group members</span>
                            {currentChat?.members.map((u) => (
                                <UserListItem key={u._id} user={u} groupAdmin={currentChat?.groupAdmin?.username} />
                            ))}
                        </div>
                    </>
                ) : (
                    <span className="other-user">{peerName}</span>
                )}
            </div>
        </div>
    );
});

const Profile = ({ style, currentUI, setCurrentUI, setShowProfileInfo, fetchAgain, setFetchAgain }) => {
    const { user, currentChat } = ChatState();

    const handleBackToChat = useCallback(() => setCurrentUI('chat'), [setCurrentUI]);
    const handleCloseProfile = useCallback(() => setShowProfileInfo(false), [setShowProfileInfo]);

    return (
        <div className="profile-container" style={style}>
            {currentUI === 'profile' ? (
                <MyProfile style={style} onBack={handleBackToChat} />
            ) : (
                <ChatInfo
                    currentChat={currentChat}
                    user={user}
                    onBack={handleCloseProfile}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                />
            )}
        </div>
    );
};

export default Profile;
