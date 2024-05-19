const express = require("express");
const { fetchAllMessages, sendMessage, } = require("../controllers/messageControllers");
const { protect } = require("../middlewares/authMiddleware");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// route for fetching all the messages
router.route("/:chatId").get(protect, fetchAllMessages);

// route for sending a message
router.route("/").post(protect, upload.single('image'), sendMessage);

module.exports = router;