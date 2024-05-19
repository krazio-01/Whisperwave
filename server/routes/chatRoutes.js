const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const {
    newChat,
    fetchChats,
    deleteChat,
    createGroupChat,
    renameGroup,
    removeFromGroup,
    addToGroup } = require("../controllers/chatControllers");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// new chat
router.route("/newChat").post(protect, newChat);

// for fetching all the chats of the user
router.route("/fetchChats").get(protect, fetchChats);

// delete the chat between two users
router.route("/deleteChat").post(protect, deleteChat);

// creating a group chat
router.route("/group").post(protect, upload.single('groupProfilePic'), createGroupChat);

// renaming a group
router.route("/rename").put(protect, renameGroup);

// removing someone from group
router.route("/remove").put(protect, removeFromGroup);

// adding someone to group
router.route("/add").put(protect, addToGroup);

module.exports = router;