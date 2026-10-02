const RSVP = require("../models/RSVP");

const createRSVP = async (rsvpData) => {
  return RSVP.create(rsvpData);
};

const getRSVPsByEvent = async (eventId) => {
  return RSVP.find({ event: eventId }).sort({ createdAt: -1 });
};

module.exports = {
  createRSVP,
  getRSVPsByEvent,
};