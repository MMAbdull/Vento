const express = require('express');

const { createRSVP, getRSVPsByEvent } = require('../controllers/rsvpController');

const router = express.Router();

router.post('/:eventId/rsvps', createRSVP);
router.get('/:eventId/rsvps', getRSVPsByEvent);

module.exports = router;