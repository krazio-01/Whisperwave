const router = require('express').Router();
const {
    searchUser,
    fetchAllAssociatedUsers,
    updateUserProfile,
    verifyEmailChange,
} = require('../controllers/userControllers');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// search a user
router.route('/searchUser').post(protect, searchUser);

// get all users
router.route('/associated').get(protect, fetchAllAssociatedUsers);

// update user details
router.put('/update', protect, upload.single('profilePicture'), updateUserProfile);

// verify email change
router.post('/verify-email-change', protect, verifyEmailChange);

module.exports = router;
