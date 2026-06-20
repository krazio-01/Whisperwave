const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/sendMail');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const generateAuthToken = require('../config/generateAuthToken');

const EMAIL_VERIFICATION_TTL = 24 * 60 * 60 * 1000; // 24H
const PASSWORD_RESET_TTL = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_COOLDOWN = 2 * 60 * 1000; // 2 minutes
const DEFAULT_AVATAR =
    'https://res.cloudinary.com/krazio/image/upload/v1691851513/whisperwave/person/noAvatar_fr72mb.png';

const registerUser = async (req, res) => {
    const { username, email, password, confirmPass } = req.body;

    if (!username || !email || !password || !confirmPass)
        return res.status(400).json({ Error: 'Please fill in all fields' });

    if (password.length < 6) return res.status(400).json({ Error: 'Password must be at least 6 characters' });

    if (password !== confirmPass) return res.status(400).json({ Error: 'Passwords do not match' });

    try {
        const [emailExist, usernameExist] = await Promise.all([
            User.findOne({ email }).lean(),
            User.findOne({ username }).lean(),
        ]);

        if (emailExist) return res.status(400).json({ Error: 'An account with this email already exists.' });
        if (usernameExist) return res.status(400).json({ Error: 'This username is unavailable.' });

        const [hashedPassword, imageUrl] = await Promise.all([
            bcrypt.hash(password, 10),
            req.file ? uploadImageToCloudinary(req.file, 'person') : Promise.resolve(DEFAULT_AVATAR),
        ]);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            emailToken: crypto.randomBytes(32).toString('hex'),
            emailTokenExpire: new Date(Date.now() + EMAIL_VERIFICATION_TTL),
            profilePicture: imageUrl,
        });

        const user = await newUser.save();
        if (!user) return res.status(400).json({ Error: 'Something went wrong', success: false });

        res.status(201).json({ success: true });

        const verifyLink = `${process.env.BASE_URL}/api/auth/${user._id}/verify/${user.emailToken}`;

        Promise.all([
            sendEmail(user.email, 'Account Verification', 'verifyEmail.ejs', { username: user.username, verifyLink }),
            sendEmail(user.email, 'Welcome to whisperwave!', 'welcomeEmail.ejs', { username: user.username }),
        ]).catch((err) => console.error('Background signup emails failed:', err));
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ Error: `That ${field} is already in use.` });
        }
        if (!res.headersSent) res.status(500).send('Server Error');
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(401).json({ Error: 'Please fill in all fields' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ Error: 'Invalid credentials!' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ Error: 'Invalid credentials!' });

        if (!user.isVerified) {
            const now = new Date();

            if (!user.emailTokenExpire || user.emailTokenExpire < now) {
                user.emailToken = crypto.randomBytes(32).toString('hex');
                user.emailTokenExpire = new Date(Date.now() + EMAIL_VERIFICATION_TTL);
                await user.save();

                sendEmail(user.email, 'Account Verification', 'verifyEmail.ejs', {
                    username: user.username,
                    verifyLink: `${process.env.BASE_URL}/api/auth/${user._id}/verify/${user.emailToken}`,
                }).catch((err) => console.error('Verification email re-send failed:', err));

                return res.status(403).json({
                    Error: 'Account not verified. A fresh activation link has been sent to your inbox!',
                });
            }
            return res.status(403).json({ Error: 'Please check your inbox to verify your account first!.' });
        }

        return res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            authToken: generateAuthToken(user._id),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).render('emailVerification', { message: 'Invalid link' });

        const user = await User.findOne({ emailToken: token });
        if (!user)
            return res
                .status(400)
                .render('emailVerification', { message: 'Your account is already verified or token is invalid.' });

        if (user.emailTokenExpire && user.emailTokenExpire < new Date()) {
            return res.status(400).render('emailVerification', {
                message: 'This verification link has expired. Log in to get a new one.',
            });
        }

        user.emailToken = undefined;
        user.emailTokenExpire = undefined;
        user.isVerified = true;
        await user.save();

        return res.status(200).render('emailVerification', {
            message: 'Email successfully verified, you can close this window now',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const SUCCESS_MESSAGE = 'If this email is registered, a reset link has been sent.';

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ message: SUCCESS_MESSAGE });

        if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
            const timeRemaining = user.resetPasswordExpire - Date.now();
            const timePassed = PASSWORD_RESET_TTL - timeRemaining;

            if (timePassed < PASSWORD_RESET_COOLDOWN) {
                const waitTime = Math.ceil((PASSWORD_RESET_COOLDOWN - timePassed) / 1000);
                return res.status(429).json({
                    message: `Please wait ${waitTime} seconds before requesting another link.`,
                });
            }
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + PASSWORD_RESET_TTL;

        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        sendEmail(user.email, 'Password Reset Request', 'passwordResetEmail.ejs', {
            username: user.username,
            resetUrl: resetUrl,
        }).catch((err) => console.error('Reset password email dispatch failed:', err));

        return res.status(200).json({ message: SUCCESS_MESSAGE });
    } catch (error) {
        console.error('Password reset routing failure:', error);
        try {
            await User.updateOne({ email }, { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } });
        } catch (dbErr) {
            console.error('Token cleanup failure:', dbErr);
        }
        return res.status(500).json({ message: 'Server Error' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        const [salt] = await Promise.all([bcrypt.genSalt(10)]);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset compilation failure:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword };
