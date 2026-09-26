const eventRepository = require("../repositories/eventRepository");

const createEvent = async (eventData) => {
  return await eventRepository.createEvent(eventData);
};

const findEventById = async (id) => {
  return await eventRepository.findEventById(id);
};

module.exports = {
  createEvent,
  findEventById,
};