const express = require('express');

const { createRSVP, getRSVPsByEvent } = require('../controllers/rsvpController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:eventId/rsvps', createRSVP);
router.get('/:eventId/rsvps', authenticate, getRSVPsByEvent);

module.exports = router;
