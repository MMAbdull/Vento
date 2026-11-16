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
const csrf = (req, res, next) => req.app.locals.csrf.validate(req, res, next);

//public routes
router.get("/slug/:slug", getEventBySlug);

//authenticated customer routes
router.post("/", authenticate, csrf, createEvent);
router.put("/:id", authenticate, csrf, updateEvent);
router.put("/:id/publish", authenticate, csrf, publishEvent);
router.get("/:id", authenticate, getEventById);

module.exports = router;
