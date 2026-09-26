const eventRepository = require("../repositories/eventRepository");

const createEvent = async (eventData) => {
  return eventRepository.createEvent(eventData);
};

const findEventById = async (id) => {
  return eventRepository.findEventById(id);
};

module.exports = {
  createEvent,
  findEventById,
};