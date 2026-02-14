const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            require: true,
            min: 3,
            max: 20,
            unique: true,
        },
        lastUsernameChange: { type: Date, default: null },
        email: {
            type: String,
            required: true,
            max: 25,
            unique: true,
        },
        tempEmail: { type: String, default: null },
        password: {
            type: String,
            required: true,
            min: 1,
        },
        confirm_password: { type: String, min: 1 },
        isVerified: { type: Boolean, default: false },
        emailToken: { type: String },
        emailOtp: { type: String, default: null },
        otpExpire: { type: Date, default: null },
        profilePicture: { type: String, default: '' },
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
