const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            min: 3,
            max: 20,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            max: 25,
            unique: true,
        },
        profilePicture: {
            type: String,
            default: '',
        },

        password: {
            type: String,
            required: true,
            min: 1,
        },

        isVerified: { type: Boolean, default: false },
        emailToken: { type: String },

        resetPasswordToken: { type: String, default: null },
        resetPasswordExpire: { type: Date, default: null },

        emailOtp: { type: String, default: null },
        otpExpire: { type: Date, default: null },
        tempEmail: { type: String, default: null },
        lastUsernameChange: { type: Date, default: null },
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
