const Event = require("../models/Event");

const createEvent = async (eventData) => {
  return Event.create(eventData);
};

const findEventById = async (id) => {
  return Event.findById(id);
};

const findEventBySlug = async (slug) => {
  return Event.findOne({ slug });
}

const updateEvent = async (id, eventData) => {
  return Event.findByIdAndUpdate(id, eventData, {
    returnDocument: true,
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
      returnDocument: true,
      runValidators: true,
    });
};

module.exports = {
  createEvent,
  findEventById,
  findEventBySlug,
  updateEvent,
  publishEvent,
};