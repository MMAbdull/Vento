const express = require("express");

const {
  createEvent,
  getEventById,
  updateEvent,
  publishEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.post("/", createEvent);
router.get("/:id", getEventById);
router.put("/:id", updateEvent);
router.put("/:id/publish", publishEvent);

module.exports = router;