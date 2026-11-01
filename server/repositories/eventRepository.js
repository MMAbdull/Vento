const Event = require("../models/Event");

const createEvent = async (eventData) => {
  return Event.create(eventData);
};

const findOwnedEventById = async (id, ownerId) => {
  return Event.findOne({ _id: id, owner: ownerId });
};

const findEventBySlug = async (slug) => {
  return Event.findOne({ slug });
}

const updateOwnedEvent = async (id, ownerId, eventData) => {
  return Event.findOneAndUpdate(
    { _id: id, owner: ownerId },
    eventData,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );
};

const publishOwnedEvent = async (id, ownerId, slug) => {
  return Event.findOneAndUpdate(
    { _id: id, owner: ownerId },
    {
      status: "published",
      slug,
    },
    {
      returnDocument: "after",
      runValidators: true,
    });
};

module.exports = {
  createEvent,
  findOwnedEventById,
  findEventBySlug,
  updateOwnedEvent,
  publishOwnedEvent,
};