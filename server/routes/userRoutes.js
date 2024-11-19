const router = require("express").Router();
const { allUsers, searchUser } = require("../controllers/userControllers");
const { protect } = require("../middlewares/authMiddleware");

// search a user
router.route("/searchUser").post(protect, searchUser);

// get all users
router.route("/").get(protect, allUsers);

module.exports = router;
