const rsvpService = require('../services/rsvpService');
const eventService = require('../services/eventService');

const createRSVP = async (req, res) => {
  try {
    const rsvp = await rsvpService.createRSVP(req.params.eventId, req.body);

    res.status(201).json({
      success: true,
      data: rsvp,
    });
  } catch (error) {
    const expected = error instanceof rsvpService.RSVPError;
    res.status(expected ? error.statusCode : 503).json({
      success: false,
      message: expected ? error.message : 'Unable to submit RSVP',
    });
  }
};

const getRSVPsByEvent = async (req, res) => {
  try {
    const eventId = rsvpService.validateEventId(req.params.eventId);
    const event = await eventService.findOwnedEventById(eventId, req.user.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const rsvps = await rsvpService.findRSVPsByEvent(eventId);

    res.status(200).json({
      success: true,
      data: rsvps,
    });
  } catch (error) {
    const expected = error instanceof rsvpService.RSVPError;
    res.status(expected ? error.statusCode : 503).json({
      success: false,
      message: expected ? error.message : 'Unable to list RSVP responses',
    });
  }
};

module.exports = {
  createRSVP,
  getRSVPsByEvent,
};
