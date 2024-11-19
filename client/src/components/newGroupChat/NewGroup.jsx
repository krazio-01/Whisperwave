import './newgroup.css';
import React, { useState } from 'react';
import backBtnIcon from '../../Assets/images/backBtn.png';
import doneIcon from '../../Assets/images/next.png';
import GroupPicture from '../../Assets/images/uploadPicture.png';
import { ChatState } from '../../context/ChatProvider';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import UserBadgeItem from '../miscellaneous/userBadgeItem/UserBadgeItem';
import axios from 'axios';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';

const NewGroup = ({ setCurrentUI }) => {
    const [searchLoading, setSearchLoading] = useState(false);
    const [createGroupLoading, setCeateGroupLoading] = useState(false);
    const [searchResult, setSearchResult] = useState([]);
    const [groupChatName, setGroupChatName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [doneSelection, setdoneSelection] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const { user, chats, setChats } = ChatState();

    const handleGroup = (userToAdd) => {
        if (selectedUsers.includes(userToAdd)) {
            toast.warning('User already added');
            return;
        }

        setSelectedUsers([...selectedUsers, userToAdd]);
    };

    const handleDelete = (delUser) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
    };

    const handleSearch = async (query) => {
        if (!query)
            return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            setSearchLoading(true);
            const { data } = await axios.get(`/users?search=${query}`, config);
            setSearchResult(data);
            setSearchLoading(false);
        }
        catch (error) {
            console.log(error);
            setSearchLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!groupChatName || !selectedUsers) {
            toast.error("Please Enter Group name");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', groupChatName);
            formData.append('members', JSON.stringify(selectedUsers.map((u) => u._id)));
            formData.append('groupProfilePic', selectedFile);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            setCeateGroupLoading(true);
            const { data } = await axios.post(`/chat/group`, formData, config);
            setChats([data, ...chats]);
            setCurrentUI("chat");
            toast.success("New Group Chat Created!");
            setCeateGroupLoading(false);
        }
        catch (error) {
            console.log(error);
            toast.error("Failed to Create the Chat!");
        }
    };

    const handleButtonInput = (e) => {
        if (!doneSelection)
            setdoneSelection(!doneSelection);
        else
            handleSubmit();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (allowedTypes.includes(file.type)) {
                setSelectedFile(file);
                setSelectedImage(URL.createObjectURL(file));
            }
            else {
                toast.error("Please select an image!");
                e.target.value = null;
            }
        }
    };

    return (
        <div className='newGroupChat'>
            {!doneSelection ? <>
                <div className="newGroupChatTop">
                    <div className='Group'>
                        <img className='backButtonGroup' src={backBtnIcon} alt='Back' onClick={() => { setCurrentUI("chat") }}></img>
                        <span>Add Members</span>
                    </div>

                    <div className="searchUserForGroup">
                        <input
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder='Add people...'
                            className='chatGroupSearch'
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
                        {searchLoading ? <ListItemSkeleton count={searchResult.length ? searchResult.length : 1}/> : (searchResult?.slice(0, 4).map((user) => (
                            <UserListItem
                                key={user._id}
                                user={user}
                                handleFunction={() => handleGroup(user)}
                            />
                        )))}
                    </div>
                </div>
            </> : <div className='createGroupChat'>

                <div className="doneHeader">
                    <img className='backButtonGroup' src={backBtnIcon} alt='Back' onClick={() => { setdoneSelection(!doneSelection) }}></img>

                    <div className="selectImage">
                        <input style={{ display: 'none' }} type='file' id='groupPictureId' onChange={handleFileChange} />
                        <label htmlFor='groupPictureId'>
                            {selectedImage ? <img src={selectedImage} alt='' /> : <img src={GroupPicture} alt='' />}
                        </label>
                    </div>
                </div>

                <div className="searchUserForGroup">
                    <input className='chatGroupSearch' placeholder='Group Name' onChange={(e) => setGroupChatName(e.target.value)} />
                </div>
            </div>}
            <div className="donSelection">
                <button className='donSelectioBtn' onClick={handleButtonInput}>
                    {createGroupLoading ? <CircularProgress size={28} color="secondary" /> : <img src={doneIcon} alt='' />}
                </button>
            </div>
        </div>
    )
};

export default NewGroup
