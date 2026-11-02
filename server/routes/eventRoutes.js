const express = require("express");

const {
  createEvent,
  getEventById,
  getEventBySlug,
  updateEvent,
  publishEvent,
} = require("../controllers/eventController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

//public routes
router.get("/slug/:slug", getEventBySlug);

//authenticated customer routes
router.post("/", authenticate, createEvent);
router.put("/:id", authenticate, updateEvent);
router.put("/:id/publish", authenticate, publishEvent);
router.get("/:id", authenticate, getEventById);

module.exports = router;