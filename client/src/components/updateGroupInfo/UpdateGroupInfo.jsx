import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserListItem from '../miscellaneous/userListItem/UserListItem';
import ListItemSkeleton from '../miscellaneous/listItemSkeleton/ListItemSkeleton';
import backBtn from '../../Assets/images/backBtn.png';
import { ChatState } from '../../context/ChatProvider';
import 'react-toastify/dist/ReactToastify.css';
import './updategroupinfo.css';

const toastOptions = {
    autoClose: 2000,
    theme: 'dark',
};

const UpdateGroupInfo = ({ showAddOrRemoveConrols, setShowAddOrRemoveConrols, fetchAgain, setFetchAgain }) => {
    const { user, currentChat, setCurrentChat } = ChatState();

    const [groupName, setGroupname] = useState('');
    const [associatedUsers, setAssociatedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [updateNameLoading, setUpdateNameLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    const authConfig = useMemo(
        () => ({
            headers: { Authorization: `Bearer ${user?.authToken}` },
        }),
        [user?.authToken],
    );

    useEffect(() => {
        if (currentChat?.chatName) {
            setGroupname(currentChat.chatName);
        }
    }, [currentChat]);

    useEffect(() => {
        const fetchAssociatedUsers = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data } = await axios.get('/users/associated', authConfig);
                setAssociatedUsers(data);
            } catch (error) {
                toast.error(error?.response?.data || 'Failed to load users', toastOptions);
            } finally {
                setLoading(false);
            }
        };

        fetchAssociatedUsers();
    }, [user, authConfig]);

    const sortedAssociatedUsers = useMemo(() => {
        if (!associatedUsers) return [];

        const currentMemberIds = new Set(currentChat?.members?.map((m) => m._id) || []);

        return [...associatedUsers].sort((a, b) => {
            const isAMember = currentMemberIds.has(a._id);
            const isBMember = currentMemberIds.has(b._id);
            return (isAMember === isBMember) ? 0 : isAMember ? -1 : 1;
        });
    }, [associatedUsers, currentChat?.members]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return sortedAssociatedUsers;

        return sortedAssociatedUsers.filter((u) =>
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, sortedAssociatedUsers]);

    const handleUpdateName = async () => {
        if (!groupName) return;
        setUpdateNameLoading(true);
        try {
            const { data } = await axios.put(
                '/chat/rename',
                {
                    chatId: currentChat._id,
                    chatName: groupName,
                },
                authConfig,
            );

            setCurrentChat(data);
            setFetchAgain(!fetchAgain);
        } catch (error) {
            toast.error('Error Occured!', toastOptions);
        } finally {
            setUpdateNameLoading(false);
        }
    };

    const handleAddUser = async (member) => {
        if (currentChat?.members?.some((u) => u._id === member._id))
            return toast.warning('User already in group!', toastOptions);

        if (currentChat?.groupAdmin?._id !== user._id) return toast.error('Only admins can add someone!', toastOptions);

        try {
            await axios.put(
                '/chat/add',
                {
                    chatId: currentChat._id,
                    userId: member._id,
                },
                authConfig,
            );

            setCurrentChat((prev) => ({
                ...prev,
                members: [...prev.members, member],
            }));
            setFetchAgain(!fetchAgain);
            toast.success(`${member.username} Added`, toastOptions);
        } catch (error) {
            toast.error('Error Occured!', toastOptions);
        }
    };

    const handleRemoveUser = async (member) => {
        if (currentChat.groupAdmin._id !== user._id && member._id !== user._id)
            return toast.error('You are not the group admin', toastOptions);

        try {
            await axios.put(
                '/chat/remove',
                {
                    chatId: currentChat._id,
                    userId: member._id,
                },
                authConfig,
            );

            setCurrentChat((prev) => ({
                ...prev,
                members: prev.members.filter((m) => m._id !== member._id),
            }));
            setFetchAgain(!fetchAgain);
            toast.success(`${member.username} Removed!`, toastOptions);
        } catch (error) {
            toast.error(error.response?.data || 'Error Occured', toastOptions);
        }
    };

    if (!currentChat) return null;

    const isAdmin = currentChat?.groupAdmin?._id === user._id;

    return (
        <div className="updateGroupinfo">
            <div className="updateInfoHeader">
                <img
                    src={backBtn}
                    alt="Back"
                    onClick={() => setShowAddOrRemoveConrols(false)}
                    style={{ cursor: 'pointer' }}
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

            {isAdmin && (
                <div className="manageUser">
                    <h2>Manage Users</h2>
                    <input
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search User..."
                        className="chatGroupSearch"
                    />
                    <ul className="users-list">
                        {loading ? (
                            <ListItemSkeleton count={5} />
                        ) : (
                            filteredUsers.map((u) => (
                                <li key={u._id}>
                                    <UserListItem
                                        user={u}
                                        showAddOrRemoveConrols={showAddOrRemoveConrols}
                                        handleRemoveUser={handleRemoveUser}
                                        handleAddUser={handleAddUser}
                                        isChatMember={currentChat.members.some((m) => m._id === u._id)}
                                    />
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UpdateGroupInfo;
