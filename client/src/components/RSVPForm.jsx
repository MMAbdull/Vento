import { useState } from "react";
import { createRSVP } from "../api/rsvpApi";
import "../styles/components/RSVPForm.css";

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
    <section className="rsvp-form">
      <div className="rsvp-form__header">
        <span className="rsvp-form__symbol">♡</span>

        <h2>RSVP</h2>

        <p>Let us know if you'll be joining us.</p>
      </div>

      <form className="rsvp-form__form" onSubmit={handleSubmit}>
        <div className="rsvp-form__field">
          <label htmlFor="guestName">Your Name</label>

          <input
            id="guestName"
            name="guestName"
            type="text"
            placeholder="Enter your name"
            value={formData.guestName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="rsvp-form__field">
          <label htmlFor="status">Attendance</label>

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="attending">I'll be there</option>
            <option value="not-attending">I can't make it</option>
          </select>
        </div>

        <div className="rsvp-form__field">
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

        <div className="rsvp-form__field">
          <label htmlFor="message">
            Message <span>Optional</span>
          </label>

          <textarea
            id="message"
            name="message"
            placeholder="Leave a message..."
            value={formData.message}
            onChange={handleChange}
            rows="4"
          />
        </div>

        {message && (
          <p className="rsvp-form__success">
            {message}
          </p>
        )}

        {error && (
          <p className="rsvp-form__error">
            {error}
          </p>
        )}

        <button
          className="rsvp-form__submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Submit RSVP"}
        </button>
      </form>
    </section>
  );
}

export default RSVPForm;