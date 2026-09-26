const Event = require("../models/Event");

const createEvent = async (eventData) => {
  return await Event.create(eventData);
};

const findEventById = async (id) => {
  return await Event.findById(id);
};

module.exports = {
  createEvent,
  findEventById,
};