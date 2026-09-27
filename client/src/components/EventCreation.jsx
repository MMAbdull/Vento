import { useState, useEffect } from "react";
import { createEvent, updateEvent } from "../api/eventApi";

function EventCreation({ event, onCreated }) {
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

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
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
    <div>
      <h2>{event ? "Edit Event" : "Create Event"}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="eventType">Event Type</label>
          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            required
          >
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

        <div>
          <label htmlFor="title">Event Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
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

        <div>
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

        <div>
          <label htmlFor="venue">Venue</label>
          <input
            id="venue"
            name="venue"
            type="text"
            value={formData.venue}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
          />
        </div>

        <div>
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

        <div>
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
          >
            <option value="classic-rose">Classic Rose</option>
            <option value="potato-venue">Potato Venue</option>
          </select>
        </div>

        <button type="submit">{event ? "Save Changes" : "Create Event"}</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}

export default EventCreation;