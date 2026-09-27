const express = require("express");

const {
  createEvent,
  getEventById,
  updateEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.post("/", createEvent);
router.get("/:id", getEventById);
router.put("/:id", updateEvent);

module.exports = router;