const Event = require("../models/Event");

const createEvent = async (eventData) => {
  return Event.create(eventData);
};

const findEventById = async (id) => {
  return Event.findById(id);
};

const updateEvent = async (id, eventData) => {
  return Event.findByIdAndUpdate(id, eventData, {
    new: true,
    runValidators: true,
  });
};

module.exports = {
  createEvent,
  findEventById,
  updateEvent,
};