const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

router.post("/preferences", authenticateToken, userController.savePreferences);

module.exports = router;
