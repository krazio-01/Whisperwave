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
        emailTokenExpire: { type: Date },

        resetPasswordToken: { type: String },
        resetPasswordExpire: { type: Date },

        emailOtp: { type: String },
        otpExpire: { type: Date },
        tempEmail: { type: String },
        lastUsernameChange: { type: Date },
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
