const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

router.post("/preferences", authenticateToken, userController.savePreferences);
router.get("/preferences", authenticateToken, userController.getPreferences);

module.exports = router;
