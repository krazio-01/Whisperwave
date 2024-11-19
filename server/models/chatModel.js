const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
    {
        chatName: {
            type: String,
            trim: true
        },
        isGroupChat: {
            type: Boolean,
            default: false
        },
        groupProfilePic: {
            type: String,
            default: ""
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        unseenMessageCounts: {
            type: Map,
            of: Number,
            default: {}
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
