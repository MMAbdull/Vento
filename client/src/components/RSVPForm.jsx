import { useState } from "react";
import { createRSVP } from "../api/rsvpApi";

function RSVPForm({ eventId }) {
  const [formData, setFormData] = useState({
    guestName: "",
    status: "attending",
    guestCount: 1,
    message: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setMessage("");
      setIsSubmitting(true);

      await createRSVP(eventId, {
        ...formData,
        guestCount: Number(formData.guestCount),
      });

      setMessage("Your RSVP has been submitted.");

      setFormData({
        guestName: "",
        status: "attending",
        guestCount: 1,
        message: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2>RSVP</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="guestName">Your Name</label>

          <input
            id="guestName"
            name="guestName"
            type="text"
            value={formData.guestName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="status">Attendance</label>

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="attending">Attending</option>
            <option value="not-attending">Not Attending</option>
          </select>
        </div>

        <div>
          <label htmlFor="guestCount">Number of Guests</label>

          <input
            id="guestCount"
            name="guestCount"
            type="number"
            min="0"
            value={formData.guestCount}
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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit RSVP"}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </section>
  );
}

export default RSVPForm;