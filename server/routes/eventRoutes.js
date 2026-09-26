const express = require("express");

const {
  createEvent,
  getEventById,
} = require("../controllers/eventController");

const router = express.Router();

router.post("/", createEvent);
router.get("/:id", getEventById);

module.exports = router;