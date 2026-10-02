const rsvpService = require('../services/rsvpService');

const createRSVP = async (req, res) => {
  try {
    const rsvp = await rsvpService.createRSVP({
      event: req.params.eventId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: rsvp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRSVPsByEvent = async (req, res) => {
  try {
    const rsvps = await rsvpService.findRSVPsByEvent(req.params.eventId);

    res.status(200).json({
      success: true,
      data: rsvps,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRSVP,
  getRSVPsByEvent,
};