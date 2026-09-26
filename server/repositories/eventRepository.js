const Event = require("../models/Event");

const createEvent = async (eventData) => {
  return Event.create(eventData);
};

const findEventById = async (id) => {
  return Event.findById(id);
};

module.exports = {
  createEvent,
  findEventById,
};