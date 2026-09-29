const eventRepository = require("../repositories/eventRepository");
const generateSlug = require("../utils/generateSlug");

const createEvent = async (eventData) => {
  return eventRepository.createEvent(eventData);
};

const findEventById = async (id) => {
  return eventRepository.findEventById(id);
};

const findEventBySlug = async (slug) => {
  return eventRepository.findEventBySlug(slug);
}

const updateEvent = async (id, eventData) => {
  return eventRepository.updateEvent(id, eventData);
};

const publishEvent = async (id) => {
  const event = await eventRepository.findEventById(id);

  if (!event) {
    return null;
  }

  const slug = generateSlug(event.title, event._id.toString());

  return eventRepository.publishEvent(id, slug);
};

module.exports = {
  createEvent,
  findEventById,
  findEventBySlug,
  updateEvent,
  publishEvent,
};