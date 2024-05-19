const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        text: {
            type: String
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat"
        },
        image: {
            type: String,
            default: ""
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
