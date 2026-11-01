const eventRepository = require("../repositories/eventRepository");
const generateSlug = require("../utils/generateSlug");

const createEvent = async (eventData) => {
  return eventRepository.createEvent(eventData);
};

const findOwnedEventById = async (id, ownerId) => {
  return eventRepository.findOwnedEventById(id, ownerId);
};

const findEventBySlug = async (slug) => {
  return eventRepository.findEventBySlug(slug);
}

const updateOwnedEvent = async (id, ownerId, eventData) => {
  return eventRepository.updateOwnedEvent(id, ownerId, eventData);
};

const publishOwnedEvent = async (id, ownerId) => {
  const event = await eventRepository.findOwnedEventById(id, ownerId);

  if (!event) {
    return null;
  }

  const slug = generateSlug(event.title, event._id.toString());

  return eventRepository.publishOwnedEvent(id, ownerId, slug);
};

module.exports = {
  createEvent,
  findOwnedEventById,
  findEventBySlug,
  updateOwnedEvent,
  publishOwnedEvent,
};