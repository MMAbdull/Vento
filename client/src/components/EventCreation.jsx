import { useState } from "react";
import { createInvitation } from "../api/invitationApi";

function EventCreation({ onCreated }) {
  const [formData, setFormData] = useState({
    coupleNames: "",
    date: "",
    time: "",
    venue: "",
    message: "",
    language: "en",
    theme: "classic-rose",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const result = await createInvitation(formData);

      onCreated(result.data);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Create Event</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="coupleNames">Couple Names</label>
          <input
            id="coupleNames"
            name="coupleNames"
            type="text"
            value={formData.coupleNames}
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
          </select>
        </div>

        <button type="submit">Create Event</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}

export default EventCreation;