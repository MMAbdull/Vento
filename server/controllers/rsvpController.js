const rsvpService = require('../services/rsvpService');
const eventService = require('../services/eventService');

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
    const event = await eventService.findOwnedEventById(req.params.eventId, req.user.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

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
