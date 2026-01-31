import { useState, useEffect } from 'react';
import axios from 'axios';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import backBtn from '../../Assets/images/backBtn.png';
import { ChatState } from '../../context/ChatProvider';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './updategroupinfo.css';

const UpdateGroupInfo = ({ showAddOrRemoveConrols, setShowAddOrRemoveConrols, fetchAgain, setFetchAgain }) => {
    const { user, currentChat, setCurrentChat } = ChatState();

    const [groupName, setGroupname] = useState(currentChat?.chatName || '');
    const [associatedUsers, setAssociatedUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [updateNameLoading, setUpdateNameLoading] = useState(false);
    const [chatMembers, setChatMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentChat) setGroupname(currentChat.chatName);
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

                const { data } = await axios.get('/users/associated', config);

                const currentMemberIds = new Set(
                    currentChat?.members?.map((m) => m._id) || []
                );

                data.sort((a, b) => {
                    const isAMember = currentMemberIds.has(a._id);
                    const isBMember = currentMemberIds.has(b._id);
                    if (isAMember && !isBMember) return -1;
                    if (!isAMember && isBMember) return 1;
                });

                setAssociatedUsers(data);
                setFilteredUsers(data);
                setChatMembers(() => {
                    if (!currentChat || !currentChat.members) return [];
                    return currentChat.members.filter((member) => member._id !== user._id);
                });
            } catch (error) {
                toast.error(error?.response?.data || 'Failed to load');
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
            const { data } = await axios.put(
                `/chat/rename`,
                {
                    chatId: currentChat._id,
                    chatName: groupName,
                },
                config,
            );

            setCurrentChat(data);
            setFetchAgain(!fetchAgain);
            setUpdateNameLoading(false);
        } catch (error) {
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
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            await axios.put(
                `/chat/add`,
                {
                    chatId: currentChat._id,
                    userId: member._id,
                },
                config,
            );

            setCurrentChat((prevChat) => ({
                ...prevChat,
                members: [...prevChat.members, member]
            }));
            setChatMembers((prev) => [...prev, member]);
            setFetchAgain(!fetchAgain);
            toast.success(`${member.username} Added`, {
                autoClose: 2000,
                theme: 'dark',
            });
        } catch (error) {
            toast.error('Error Occured!', {
                autoClose: 2000,
                theme: 'dark',
            });
        }
    };

    const handleRemoveUser = async (member) => {
        if (currentChat.groupAdmin._id !== user._id && member._id !== user._id)
            return toast.error('You are not the group admin', {
                autoClose: 2000,
                theme: 'dark',
            });

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.authToken}`,
                },
            };

            await axios.put(
                `/chat/remove`,
                {
                    chatId: currentChat._id,
                    userId: member._id,
                },
                config,
            );

            const updatedMembers = currentChat.members.filter((m) => m._id !== member._id);
            setCurrentChat({
                ...currentChat,
                members: updatedMembers,
            });
            setChatMembers((prev) => prev.filter((m) => m._id !== member._id));
            setFetchAgain(!fetchAgain);
            toast.success(`${member.username} Removed!`, {
                autoClose: 2000,
                theme: 'dark',
            });
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data, {
                    autoClose: 2000,
                    theme: 'dark',
                });
            }
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;

        if (!val) setFilteredUsers(associatedUsers);
        else {
            const matches = associatedUsers.filter((u) => u.username.toLowerCase().includes(val.toLowerCase()));
            setFilteredUsers(matches);
        }
    };

    return (
        <div className="updateGroupinfo">
            <div className="updateInfoHeader">
                <img
                    src={backBtn}
                    alt="Back"
                    onClick={() => {
                        setShowAddOrRemoveConrols(!setShowAddOrRemoveConrols);
                    }}
                />
                <label>Update Group Info</label>
            </div>

            <div className="updateGroupName">
                <h2>Rename Group</h2>
                <div className="updateIt">
                    <input
                        value={groupName}
                        onChange={(e) => setGroupname(e.target.value)}
                        placeholder="Update Name..."
                        className="chatGroupSearch"
                    />
                    <button onClick={handleUpdateName} disabled={updateNameLoading}>
                        {updateNameLoading ? 'Updating...' : 'Update'}
                    </button>
                </div>
            </div>

            {currentChat?.groupAdmin?._id === user._id ? (
                <>
                    <div className="manageUser">
                        <h2>Manage Users</h2>
                        <input
                            onChange={(e) => handleSearchChange(e)}
                            placeholder="Search User..."
                            className="chatGroupSearch"
                        />
                        <ul className="users-list">
                            {loading ? (
                                <ListItemSkeleton count={5} />
                            ) : (
                                filteredUsers?.map((user) => (
                                    <li>
                                        <UserListItem
                                            key={user._id}
                                            user={user}
                                            showAddOrRemoveConrols={showAddOrRemoveConrols}
                                            handleRemoveUser={handleRemoveUser}
                                            handleAddUser={handleAddUser}
                                            isChatMember={chatMembers.some((member) => member._id === user._id)}
                                        />
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default UpdateGroupInfo;
