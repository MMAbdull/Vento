const eventRepository = require("../repositories/eventRepository");

const createEvent = async (eventData) => {
  return eventRepository.createEvent(eventData);
};

const findEventById = async (id) => {
  return eventRepository.findEventById(id);
};

const updateEvent = async (id, eventData) => {
  return eventRepository.updateEvent(id, eventData);
};

module.exports = {
  createEvent,
  findEventById,
  updateEvent,
};