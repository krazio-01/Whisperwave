const router = require("express").Router();
const { searchUser, fetchAllAssociatedUsers } = require("../controllers/userControllers");
const { protect } = require("../middlewares/authMiddleware");

// search a user
router.route("/searchUser").post(protect, searchUser);

// get all users
router.route("/associated").get(protect, fetchAllAssociatedUsers);

module.exports = router;
