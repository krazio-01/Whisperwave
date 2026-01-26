import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import { debounce } from 'lodash';
import 'react-loading-skeleton/dist/skeleton.css';
import 'react-toastify/dist/ReactToastify.css';
import './newgroup.css';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import UserBadgeItem from '../miscellaneous/userBadgeItem/UserBadgeItem';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import { ChatState } from '../../context/ChatProvider';
import backBtnIcon from '../../Assets/images/backBtn.png';
import doneIcon from '../../Assets/images/next.png';
import GroupPicture from '../../Assets/images/uploadPicture.png';

const NewGroup = ({ setCurrentUI }) => {
    const [searchLoading, setSearchLoading] = useState(false);
    const [createGroupLoading, setCeateGroupLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [query, setQuery] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [groupChatName, setGroupChatName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const { user, chats, setChats } = ChatState();

    const performSearch = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setSearchResult([]);
            setSearchLoading(false);
            return;
        }

        try {
            setSearchLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${user.authToken}` },
            };
            const { data } = await axios.get(`/users?search=${searchTerm}`, config);
            setSearchResult(data);
        } catch (error) {
            console.error("Search failed", error);
            toast.error("Failed to load search results");
        } finally {
            setSearchLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((nextValue) => performSearch(nextValue), 400),
        [user.authToken]
    );

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        debouncedSearch(val);
    };

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    useEffect(() => {
        return () => {
            if (selectedImage) URL.revokeObjectURL(selectedImage);
        };
    }, [selectedImage]);

    const handleGroup = useCallback((userToAdd) => {
        if (selectedUsers.some((u) => u._id === userToAdd._id)) {
            toast.warning('User already added');
            return;
        }
        setSelectedUsers((prev) => [...prev, userToAdd]);
    }, [selectedUsers]);

    const handleDelete = useCallback((delUser) => {
        setSelectedUsers((prev) => prev.filter((sel) => sel._id !== delUser._id));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (allowedTypes.includes(file.type)) {
                setSelectedFile(file);
                setSelectedImage(URL.createObjectURL(file));
            } else {
                toast.error("Please select a valid image (JPEG/PNG)!");
                e.target.value = null;
            }
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!groupChatName.trim()) {
            toast.error("Please Enter Group name");
            return;
        }
        if (selectedUsers.length < 2) {
            toast.error("A group must have at least 2 users");
            return;
        }

        try {
            setCeateGroupLoading(true);
            const formData = new FormData();
            formData.append('name', groupChatName);
            formData.append('members', JSON.stringify(selectedUsers.map((u) => u._id)));
            if (selectedFile) {
                formData.append('groupProfilePic', selectedFile);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            const { data } = await axios.post(`/chat/group`, formData, config);
            setChats([data, ...chats]);
            setCurrentUI("chat");
            toast.success("New Group Chat Created!");
        } catch (error) {
            toast.error(error?.response?.data || "Failed to Create the Chat!");
        } finally {
            setCeateGroupLoading(false);
        }
    }, [groupChatName, selectedUsers, selectedFile, user.authToken, chats, setChats, setCurrentUI]);

    const handleNextStep = () => {
        if (step === 1) setStep(2);
        else handleSubmit();
    };

    const renderMemberSelection = () => (
        <>
            <div className="newGroupChatTop">
                <div className='Group'>
                    <img className='backButtonGroup' src={backBtnIcon} alt='Back' onClick={() => setCurrentUI("chat")} />
                    <span>Add Members</span>
                </div>

                <div className="searchUserForGroup">
                    <input
                        onChange={handleSearchChange}
                        placeholder='Add people...'
                        className='chatGroupSearch'
                        value={query}
                    />
                </div>
                <div className="selectedUsers">
                    {selectedUsers.map((u) => (
                        <UserBadgeItem
                            key={u._id}
                            user={u}
                            handleFunction={() => handleDelete(u)}
                        />
                    ))}
                </div>
            </div>

            <div className="resultGroup">
                <div className="output">
                    {searchLoading ? (
                        <ListItemSkeleton count={3} />
                    ) : (
                        searchResult?.slice(0, 4).map((user) => (
                            <UserListItem
                                key={user._id}
                                user={user}
                                handleFunction={() => handleGroup(user)}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );

    const renderGroupFinalization = () => (
        <div className='createGroupChat'>
            <div className="doneHeader">
                <img className='backButtonGroup' src={backBtnIcon} alt='Back' onClick={() => setStep(1)} />

                <div className="selectImage">
                    <input style={{ display: 'none' }} type='file' id='groupPictureId' onChange={handleFileChange} />
                    <label htmlFor='groupPictureId'>
                        <img src={selectedImage || GroupPicture} alt='Group Icon' />
                    </label>
                </div>
            </div>

            <div className="searchUserForGroup">
                <input
                    className='chatGroupSearch'
                    placeholder='Group Name'
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                />
            </div>
        </div>
    );

    return (
        <div className='newGroupChat'>
            {step === 1 ? renderMemberSelection() : renderGroupFinalization()}

            <div className="donSelection">
                <button className='donSelectioBtn' onClick={handleNextStep} disabled={createGroupLoading}>
                    {createGroupLoading ?
                        <CircularProgress size={28} color="secondary" /> :
                        <img src={doneIcon} alt='Next' />
                    }
                </button>
            </div>
        </div>
    );
};

export default NewGroup;
