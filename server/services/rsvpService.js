const rsvpRepository = require('../repositories/rsvpRepository');
const eventRepository = require('../repositories/eventRepository');

class RSVPError extends Error {
  constructor(message, statusCode = 400) { super(message); this.statusCode = statusCode; }
}

const validateEventId = eventId => {
  if (typeof eventId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new RSVPError('Invalid event ID');
  }
  return eventId.toLowerCase();
};

const validateInput = input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RSVPError('RSVP body must be an object');
  const { guestName, status, guestCount, message } = input;
  if (typeof guestName !== 'string' || !/[\p{L}\p{N}]/u.test(guestName)
    || !guestName.trim() || guestName.trim().length > 200 || /[\u0000-\u001f\u007f]/u.test(guestName)) {
    throw new RSVPError('Guest name must contain a letter or number and be at most 200 characters');
  }
  if (status !== 'attending' && status !== 'not-attending') throw new RSVPError('Invalid attendance status');
  if (!Number.isSafeInteger(guestCount) || (status === 'attending' ? guestCount < 1 : guestCount !== 0)) {
    throw new RSVPError('Guest count must be a positive safe integer when attending, or zero when declining');
  }
  if (message !== undefined && (typeof message !== 'string' || message.trim().length > 2000
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(message))) {
    throw new RSVPError('Message must be a string of at most 2000 characters');
  }
  return { guestName: guestName.trim(), status, guestCount,
    ...(message !== undefined ? { message: message.trim() } : {}) };
};

const createRSVP = async (eventId, input) => {
  const id = validateEventId(eventId);
  const fields = validateInput(input);
  const event = await eventRepository.findPublishedEventById(id);
  if (!event) throw new RSVPError('Event not found', 404);
  // Relationship is always route-owned. Unknown client fields never reach MongoDB.
  return rsvpRepository.createRSVP({ ...fields, event: id });
};

const findRSVPsByEvent = async (eventId) => {
  return rsvpRepository.getRSVPsByEvent(eventId);
};

module.exports = {
  RSVPError, validateEventId, validateInput,
  createRSVP,
  findRSVPsByEvent,
};
