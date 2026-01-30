import { useState, useEffect } from 'react';
import axios from 'axios';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import backBtn from '../../Assets/images/backBtn.png';
import { ChatState } from '../../context/ChatProvider';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './updategroupinfo.css';

const UpdateGroupInfo = ({ showUpdateGroupInfo, setShowUpdateGroupInfo, fetchAgain, setFetchAgain }) => {

    const { user, currentChat, setCurrentChat } = ChatState();

    const [groupName, setGroupname] = useState(currentChat?.chatName || "");
    const [associatedUsers, setAssociatedUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [updateNameLoading, setUpdateNameLoading] = useState(false);
    const [removeUserLoading, setRemoveUserLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentChat)
            setGroupname(currentChat.chatName);
    }, [currentChat]);

    useEffect(() => {
        const fetchAssociatedUsers = async () => {
            if (!user) return;
            setLoading(true);

            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.authToken}`,
                    },
                };

                const { data } = await axios.get("/users/associated", config);
                setAssociatedUsers(data);
                setFilteredUsers(data);
            } catch (error) {
                toast.error(error?.response?.data || "Failed to load");
            } finally {
                setLoading(false);
            }
        };

        fetchAssociatedUsers();

    }, [user]);

    if (!currentChat) return null;


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
    };

    const handleAddUser = async (member) => {
        if (currentChat?.members?.find((u) => u._id === member._id))
            return toast.warning('User already in group!', {
                autoClose: 2000,
                theme: 'dark',
            });

        if (currentChat?.groupAdmin?._id !== user._id)
            return toast.error('Only admins can add someone!', {
                autoClose: 2000,
                theme: 'dark',
            });

        try {
            setLoading(true);
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
            setLoading(false);
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
            setLoading(false);
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

            await axios.put(`/chat/remove`,
                {
                    chatId: currentChat._id,
                    userId: member._id,
                }, config
            );

            const updatedMembers = currentChat.members.filter((m) => m._id !== member._id);
            setCurrentChat({
                ...currentChat,
                members: updatedMembers,
            });

            setFetchAgain(!fetchAgain);
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
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;

        if (!val) setFilteredUsers(associatedUsers);
        else {
            const matches = associatedUsers.filter((u) =>
                u.username.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredUsers(matches);
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
                        value={groupName} // Controlled input
                        onChange={(e) => setGroupname(e.target.value)}
                        placeholder='Update Name...'
                        className='chatGroupSearch'
                    />
                    <button onClick={handleUpdateName} disabled={updateNameLoading}>{updateNameLoading ? 'Updating...' : 'Update'}</button>
                </div>
            </div>

            {currentChat?.groupAdmin?._id === user._id ? <>
                <div className="AddUser">
                    <span>Add Users</span>
                    <input
                        onChange={(e) => handleSearchChange(e)}
                        placeholder='Add Users...'
                        className='chatGroupSearch'
                    />
                    {loading ? <ListItemSkeleton count={4} /> :
                        (filteredUsers?.map((user) => (
                            <UserListItem
                                key={user._id}
                                user={user}
                                handleFunction={() => handleAddUser(user)}
                            />
                        )))}
                </div>

                <div className='RemoveUser'>
                    <span>Remove Users</span>
                    {currentChat?.members?.map((member) => (
                        member._id !== currentChat?.groupAdmin?._id &&
                        <UserListItem
                            key={member._id}
                            user={member}
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
