import { useState, useEffect } from "react";
import { createEvent, updateEvent } from "../api/eventApi";
import "../styles/components/EventCreation.css";

function EventCreation({ event, onCreated, onFormChange }) {
  const [formData, setFormData] = useState({
    eventType: event?.eventType || "",
    title: event?.title || "",
    date: event?.date ? event.date.split("T")[0] : "",
    time: event?.time || "",
    venue: event?.venue || "",
    message: event?.message || "",
    language: event?.language || "en",
    theme: event?.theme || "classic-rose",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        eventType: event.eventType || "",
        title: event.title || "",
        date: event.date ? event.date.split("T")[0] : "",
        time: event.time || "",
        venue: event.venue || "",
        message: event.message || "",
        language: event.language || "en",
        theme: event.theme || "classic-rose",
      });
    }
  }, [event]);

  const [error, setError] = useState("");

  const handleChange = (changeEvent) => {
    const { name, value } = changeEvent.target;

    const updatedData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedData);
    onFormChange(updatedData);
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    try {
      setError("");

      let result;

      if (event) {
        result = await updateEvent(event._id, formData);
      } else {
        result = await createEvent(formData);
      }

      onCreated(result.data);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="event-creation">
      <div className="event-creation__header">
        <span className="event-creation__eyebrow">VENTO</span>

        <h2>{event ? "Edit your event" : "Create your event"}</h2>

        <p>
          {event
            ? "Update your event details and see your invitation change."
            : "Set up the details for your invitation."}
        </p>
      </div>

      <form className="event-creation__form" onSubmit={handleSubmit}>
        <div className="event-creation__field">
          <label htmlFor="eventType">Event Type</label>

          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            required
          >
            <option value="">Select event type</option>
            <option value="wedding">Wedding</option>
            <option value="engagement">Engagement</option>
            <option value="gender-reveal">Gender Reveal</option>
            <option value="birthday">Birthday</option>
            <option value="baby-shower">Baby Shower</option>
            <option value="anniversary">Anniversary</option>
            <option value="graduation">Graduation</option>
            <option value="corporate">Corporate</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="event-creation__field">
          <label htmlFor="title">Event Title</label>

          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Ahmad & Sara"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="event-creation__row">
          <div className="event-creation__field">
            <label htmlFor="date">Date</label>

            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="event-creation__field">
            <label htmlFor="time">Time</label>

            <input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="event-creation__field">
          <label htmlFor="venue">Venue</label>

          <input
            id="venue"
            name="venue"
            type="text"
            placeholder="e.g. Grand Ballroom"
            value={formData.venue}
            onChange={handleChange}
            required
          />
        </div>

        <div className="event-creation__field">
          <label htmlFor="message">
            Message <span>Optional</span>
          </label>

          <textarea
            id="message"
            name="message"
            placeholder="Add a short message for your guests..."
            value={formData.message}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="event-creation__row">
          <div className="event-creation__field">
            <label htmlFor="language">Language</label>

            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div className="event-creation__field">
            <label htmlFor="theme">Theme</label>

            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
            >
              <option value="classic-rose">Classic Rose</option>
            </select>
          </div>
        </div>

        {error && <p className="event-creation__error">{error}</p>}

        <button className="event-creation__submit" type="submit">
          {event ? "Save Changes" : "Create Event"}
        </button>
      </form>
    </section>
  );
}

export default EventCreation;