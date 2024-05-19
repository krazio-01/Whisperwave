const router = require('express').Router();
const { registerUser, loginUser, verifyEmail } = require('../controllers/authControllers');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Register API
router.post('/register', upload.single('profilePicture'), registerUser);

// Login API
router.route("/login").post(loginUser);

// route for email varification
router.route("/:id/verify/:token").get(verifyEmail);

module.exports = router;