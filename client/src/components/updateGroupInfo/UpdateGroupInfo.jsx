import React, { useState } from 'react'
import './updategroupinfo.css';
import axios from 'axios';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import backBtn from '../../Assets/images/backBtn.png';
import { ChatState } from '../../context/ChatProvider';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UpdateGroupInfo = ({ showUpdateGroupInfo, setShowUpdateGroupInfo, fetchAgain, setFetchAgain, fetchMessages }) => {

    const { user, currentChat, setCurrentChat } = ChatState();
    const [groupName, setGroupname] = useState(currentChat.chatName);
    const [searchResult, setSearchResult] = useState([]);
    const [updateNameLoading, setUpdateNameLoading] = useState(false);
    const [removeUserLoading, setRemoveUserLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const handleUpdateName = async () => {
        if (!groupName) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            setUpdateNameLoading(true);
            const { data } = await axios.put(`/chat/rename`,
                {
                    chatId: currentChat._id,
                    chatName: groupName,
                }, config
            );

            setCurrentChat(data);
            setFetchAgain(!fetchAgain);
            setUpdateNameLoading(false);
        }
        catch (error) {
            toast.error('Error Occured!', {
                autoClose: 2000,
                theme: 'dark',
            });
            setUpdateNameLoading(false);
        }
        setGroupname('');
    };

    const handleAddUser = async (member) => {
        if (currentChat.members.find((u) => u._id === member._id))
            return toast.warning('User already in group!', {
                autoClose: 2000,
                theme: 'dark',
            });

        if (currentChat.groupAdmin._id !== user._id)
            return toast.error('Only admins can add someone!', {
                autoClose: 2000,
                theme: 'dark',
            });

        try {
            setSearchLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            const { data } = await axios.put(`/chat/add`,
                {
                    chatId: currentChat._id,
                    userId: member._id,
                }, config
            );

            setCurrentChat(data);
            setFetchAgain(!fetchAgain);
            setSearchLoading(false);
            toast.success(`${member.username} Added`, {
                autoClose: 2000,
                theme: 'dark',
            });
        }
        catch (error) {
            toast.error('Error Occured!', {
                autoClose: 2000,
                theme: 'dark',
            });
            setSearchLoading(false);
        }
    };

    const handleRemoveUser = async (member) => {
        if (currentChat.groupAdmin._id !== user._id && member._id !== user._id)
            return toast.error('You are not the group admin', {
                autoClose: 2000,
                theme: 'dark',
            });

        try {
            setRemoveUserLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            const { data } = await axios.put(`/chat/remove`,
                {
                    chatId: currentChat._id,
                    userId: member._id,
                }, config
            );

            member._id === user._id ? setCurrentChat('') : setCurrentChat(data);
            setFetchAgain(!fetchAgain);
            fetchMessages();
            setRemoveUserLoading(false);
            toast.success(`${member.username} Removed!`, {
                autoClose: 2000,
                theme: 'dark',
            });
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                toast.error(error.response.data, {
                    autoClose: 2000,
                    theme: 'dark',
                });
            }
            setRemoveUserLoading(false);
        }
        setGroupname('');
    };

    const handleSearch = async (query) => {
        if (!query)
            return;

        try {
            setSearchLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };
            const { data } = await axios.get(`/users?search=${query}`, config);
            setSearchResult(data);
            setSearchLoading(false);
        }
        catch (error) {
            console.log(error);
            setSearchLoading(false);
        }
    };

    return (
        <div className='updateGroupinfo'>

            <div className="updateInfoHeader">
                <img src={backBtn} alt='Back' onClick={() => { setShowUpdateGroupInfo(!showUpdateGroupInfo) }} />
                <label>Update Group Info</label>
            </div>

            <div className="updateGroupName">
                <span>Rename Group</span>
                <div className="updateIt">
                    <input
                        onChange={(e) => setGroupname(e.target.value)}
                        placeholder='Update Name...'
                        className='chatGroupSearch'
                    />
                    <button onClick={handleUpdateName} disabled={updateNameLoading}>{updateNameLoading ? 'Updating...' : 'Update'}</button>
                </div>
            </div>

            {currentChat.groupAdmin._id === user._id ? <>
                <div className="AddUser">
                    <span>Add Users</span>
                    <input
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder='Add Users...'
                        className='chatGroupSearch'
                    />
                    {searchLoading ? <ListItemSkeleton count={searchResult.length ? searchResult.length : 1} /> :
                        (searchResult?.slice(0, 4).map((user) => (
                            <UserListItem
                                key={user._id}
                                user={user}
                                handleFunction={() => handleAddUser(user)}
                            />
                        )))}
                </div>

                <div className='RemoveUser'>
                    <span>Remove Users</span>
                    {currentChat.members.map((user) => (
                        user._id !== currentChat.groupAdmin._id &&
                        <UserListItem
                            key={user._id}
                            user={user}
                            showUpdateGroupInfo={showUpdateGroupInfo}
                            handleRemoveUser={handleRemoveUser}
                            removeUserLoading={removeUserLoading}
                        />
                    ))}
                </div>
            </> : null}
        </div>
    )
}

export default UpdateGroupInfo
