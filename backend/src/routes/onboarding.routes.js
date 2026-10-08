const express = require("express");
const router = express.Router();
const onboardingController = require("../controllers/onboarding.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get(
  "/options",
  authenticateToken,
  onboardingController.getPreferencesOptions,
);

module.exports = router;
