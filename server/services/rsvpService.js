const rsvpRepository = require('../repositories/rsvpRepository');

const createRSVP = async (rsvpData) => {
  return rsvpRepository.createRSVP(rsvpData);
};

const findRSVPsByEvent = async (eventId) => {
  return rsvpRepository.getRSVPsByEvent(eventId);
};

module.exports = {
  createRSVP,
  findRSVPsByEvent,
};