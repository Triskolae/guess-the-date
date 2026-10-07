const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-code", authController.resendCode);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
