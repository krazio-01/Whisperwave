const mongoose = require('mongoose');

const MessageBucketSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
        },
        bucketId: {
            type: Number,
            required: true,
        },
        count: {
            type: Number,
            default: 0,
        },
        messages: [
            {
                sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                text: { type: String },
                image: { type: String, default: '' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true },
);

MessageBucketSchema.index({ chat: 1, bucketId: -1 });

module.exports = mongoose.model('MessageBucket', MessageBucketSchema);
