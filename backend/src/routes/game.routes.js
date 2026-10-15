const express = require("express");

const {
  getRandomObject,
} = require("../controllers/game.controller");

const router = express.Router();

router.get(
  "/object",
  getRandomObject,
);

module.exports = router;