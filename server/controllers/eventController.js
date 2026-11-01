const eventService = require("../services/eventService");

const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      owner: req.user.id,
    };


    const event = await eventService.createEvent(eventData);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await eventService.findOwnedEventById(req.params.id, req.user.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getEventBySlug = async (req, res) => {
  try {
    const event = await eventService.findEventBySlug(req.params.slug);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEvent = async (req, res) => {
  try {

    const eventData = {
      eventType: req.body.eventType,
      title: req.body.title,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      message: req.body.message,
      language: req.body.language,
      theme: req.body.theme,
    }

    const event = await eventService.updateOwnedEvent(req.params.id, req.user.id, eventData);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const publishEvent = async (req, res) => {
  try {
    const event = await eventService.publishOwnedEvent(req.params.id, req.user.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEvent,
  getEventById,
  getEventBySlug,
  updateEvent,
  publishEvent,
};