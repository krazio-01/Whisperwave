export const getProfilePic = (user, currentChat) => {
    const chatUser = currentChat?.members.find(m => m._id !== user._id);
    const isGroupChat = currentChat?.isGroupChat;

    if (chatUser && isGroupChat)
        return currentChat.groupProfilePic;

    else if (chatUser && !isGroupChat)
        return chatUser.profilePicture;

    else if (isGroupChat)
        return currentChat.groupProfilePic;
        
    else
        return user.profilePicture;
};

export const getChatImages = (message) => {
    if (message.image)
        return message.image;
};

export const getCurrentChatName = (user, currentChat) => {
    if (!currentChat) return '';
    return currentChat.isGroupChat ? currentChat.chatName : currentChat.members.find(m => m._id !== user._id).username;
};

