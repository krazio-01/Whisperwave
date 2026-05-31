const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/sendMail');
const { uploadImageToCloudinary } = require('../controllers/uploadController');
const generateAuthToken = require('../config/generateAuthToken');

const EMAIL_VERIFICATION_TTL = 24 * 60 * 60 * 1000; // 24H
const PASSWORD_RESET_TTL = 15 * 60 * 1000;      // 15 minutes
const PASSWORD_RESET_COOLDOWN = 2 * 60 * 1000;   // 2 minutes

const registerUser = async (req, res) => {
    const { username, email, password, confirmPass } = req.body;

    if (!username || !email || !password || !confirmPass)
        return res.status(400).json({ Error: 'Please fill in all fields' });

    if (password.length < 6) return res.status(400).json({ Error: 'Password must be at least 6 characters' });

    if (password !== confirmPass) return res.status(400).json({ Error: 'Passwords do not match' });

    let userExist = await User.findOne({ email: email });
    if (userExist) return res.status(400).json({ Error: 'This email is already in use!' });

    let usernameExist = await User.findOne({ username: username });
    if (usernameExist) return res.status(400).json({ Error: 'This username is already taken!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl;
    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, 'person');
    else imageUrl = 'https://res.cloudinary.com/krazio/image/upload/v1691851513/whisperwave/person/noAvatar_fr72mb.png';

    const newUser = new User({
        username: username,
        email: email,
        password: hashedPassword,
        emailToken: crypto.randomBytes(32).toString('hex'),
        emailTokenExpire: new Date(Date.now() + EMAIL_VERIFICATION_TTL),
        profilePicture: imageUrl,
    });

    try {
        const user = await newUser.save();

        if (user) res.status(200).json({ success: true });
        else res.status(400).json({ Error: 'Something went wrong', success: false });

        const to = user.email;

        // send verification mail to the user
        await sendEmail(to, 'Account Verification', 'verifyEmail.ejs', {
            username: user.username,
            verifyLink: `${process.env.BASE_URL}/api/auth/${user._id}/verify/${user.emailToken}`,
        });

        // send welcome mail to the user
        await sendEmail(to, 'Welcome to whisperwave!', 'welcomeEmail.ejs', {
            username: user.username,
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ Error: 'Please fill in all fields' });

    try {
        const user = await User.findOne({ email: email });

        if (!user) return res.status(400).json({ Error: 'Invalid credentials!' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ Error: 'Invalid credentials!' });

        if (!user.isVerified) {
            const now = new Date();

            if (!user.emailTokenExpire || user.emailTokenExpire < now) {
                user.emailToken = crypto.randomBytes(32).toString('hex');
                user.emailTokenExpire = new Date(Date.now() + EMAIL_VERIFICATION_TTL);
                await user.save();

                await sendEmail(user.email, 'Account Verification', 'verifyEmail.ejs', {
                    username: user.username,
                    verifyLink: `${process.env.BASE_URL}/api/auth/${user._id}/verify/${user.emailToken}`,
                });

                return res.status(400).json({
                    Error: 'Account not verified. A fresh activation link has been sent to your inbox!'
                });
            }

            return res.status(400).json({ Error: 'Please check your inbox to verify your account first!.' });
        }

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            authToken: generateAuthToken(user._id),
        });
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
};

const verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;
        if (!token) return res.status(400).render('emailVerification', { message: 'Invalid link' });

        const user = await User.findOne({ emailToken: token });
        if (!user) return res.status(404).render('emailVerification', { message: 'Your account is already verified' });

        if (user.emailTokenExpire && user.emailTokenExpire < new Date()) {
            return res.status(400).render('emailVerification', {
                message: 'This verification link has expired. Log in to get a new one.'
            });
        }

        user.emailToken = null;
        user.emailTokenExpire = undefined;
        user.isVerified = true;
        await user.save();

        res.status(200).render('emailVerification', {
            message: 'Email successfully verified, you can close this window now',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
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

        await sendEmail(user.email, 'Password Reset Request', 'passwordResetEmail.ejs', {
            username: user.username,
            resetUrl: resetUrl,
        });

        res.status(200).json({ message: SUCCESS_MESSAGE });
    } catch (error) {
        const user = await User.findOne({ email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
        }
        console.error('Password reset email failed:', error);
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset failed:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword };
