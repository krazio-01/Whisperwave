const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const sendEmail = require('../utils/sendMail');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// seach a user
const searchUser = async (req, res) => {
    const { username, loggedUser } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user && username !== loggedUser.username) res.json(user);
        else res.status(404).json({ message: 'User not found' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// fetch the users which are associated with loggedin user
const fetchAllAssociatedUsers = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const chats = await Chat.find({ members: currentUserId }).select('members');

        const allMemberIds = chats.reduce((acc, chat) => {
            return acc.concat(chat.members);
        }, []);

        const uniqueMemberIds = [...new Set(allMemberIds.map((id) => id.toString()))].filter(
            (id) => id !== currentUserId,
        );

        const associatedUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select(
            '_id username profilePicture email',
        );

        res.status(200).json(associatedUsers);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// update user information
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { username, email } = req.body;

        console.log('md-userId: ', userId);
        console.log('md-username, email: ', username, email);

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (username && username !== user.username) {
            if (user.lastUsernameChange) {
                const now = new Date();
                const lastChange = new Date(user.lastUsernameChange);
                const timeDiff = now - lastChange;

                if (timeDiff < COOLDOWN_MS) {
                    const daysLeft = Math.ceil((COOLDOWN_MS - timeDiff) / (1000 * 60 * 60 * 24));
                    return res.status(429).json({
                        message: `Username update unavailable. Next change allowed in ${daysLeft} days.`,
                    });
                }
            }

            const usernameExists = await User.findOne({ username });
            if (usernameExists) return res.status(400).json({ message: 'This username is already taken.' });

            user.username = username;
            user.lastUsernameChange = new Date();
        }

        let otpSent = false;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ message: 'This email is already registered.' });

            // const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otp = crypto.randomInt(100000, 999999).toString();

            user.tempEmail = email;
            user.emailOtp = otp;
            user.otpExpire = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

            const subject = 'Verify Email Change';
            const html = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Change Email Request</h2>
                    <p>Hello ${user.username},</p>
                    <p>You requested to change your email to <b>${email}</b>.</p>
                    <p>Use the code below to verify this change:</p>
                    <h1 style="color: #8b5cf6; letter-spacing: 5px;">${otp}</h1>
                    <p>This code expires in 10 minutes.</p>
                </div>
            `;

            try {
                await sendEmail(email, subject, null, html);
                otpSent = true;
            } catch (emailErr) {
                console.error('Email send failed:', emailErr);
                return res.status(500).json({ message: 'Failed to send verification email.' });
            }
        }

        if (req.file) {
            const newImageUrl = await uploadImageToCloudinary(req.file, 'person');
            const isDefaultAvatar = user.profilePicture.includes('noAvatar_fr72mb.png');

            if (user.profilePicture && !isDefaultAvatar) {
                try {
                    const urlParts = user.profilePicture.split('/');
                    const fileName = urlParts[urlParts.length - 1].split('.')[0];
                    const publicId = `whisperwave/person/${fileName}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (delErr) {
                    console.error('Failed to delete old profile image:', delErr);
                }
            }
            user.profilePicture = newImageUrl;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
            isAdmin: updatedUser.isAdmin,
            authToken: req.headers.authorization.split(' ')[1],
            otpSent: otpSent,
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

const verifyEmailChange = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (!user.emailOtp || !user.tempEmail) return res.status(400).json({ message: 'No pending email change.' });

        if (user.emailOtp !== otp || user.otpExpire < Date.now())
            return res.status(400).json({ message: 'Invalid or expired code' });

        user.email = user.tempEmail;
        user.emailOtp = undefined;
        user.tempEmail = undefined;
        user.otpExpire = undefined;

        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            token: generateToken(user._id),
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { searchUser, fetchAllAssociatedUsers, updateUserProfile, verifyEmailChange };
