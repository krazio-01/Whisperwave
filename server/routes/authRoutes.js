const router = require('express').Router();
const {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
} = require('../controllers/authControllers');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Register API
router.post('/register', upload.single('profilePicture'), registerUser);

// Login API
router.route('/login').post(loginUser);

// email verification
router.route('/:id/verify/:token').get(verifyEmail);

// password reset email route
router.route('/forgot-password').post(forgotPassword);

// new password with the token route
router.route('/reset-password/:token').put(resetPassword);

module.exports = router;
