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

const publishEvent = async (id, slug) => {
  return Event.findByIdAndUpdate(
    id,
    {
      status: "published",
      slug,
    },
    {
      new: true,
      runValidators: true,
    });
};

module.exports = {
  createEvent,
  findEventById,
  updateEvent,
  publishEvent,
};