import { useState } from "react";
import { publishEvent } from "../api/eventApi";

function EventPreview({ event, onPublished }) {
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setError("");
      setIsPublishing(true);

      const result = await publishEvent(event._id);

      onPublished(result.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      <h2>Event Preview</h2>

      <p>ID: {event._id}</p>
      <p>Event Type: {event.eventType}</p>
      <p>Title: {event.title}</p>
      <p>Date: {event.date}</p>
      <p>Time: {event.time}</p>
      <p>Venue: {event.venue}</p>
      <p>Theme: {event.theme}</p>
      <p>Status: {event.status}</p>
      {event.slug && <p>Slug: {event.slug}</p>}

      {event.status === "draft" && (
        <button type="button" onClick={handlePublish} disabled={isPublishing}>
          {isPublishing ? "Publishing..." : "Publish Event"}
        </button>
      )}

      {event.status === "published" && (
        <p>Event Published!</p>
      )}

      {error && <p>{error}</p>}
    </div>
  );
}

export default EventPreview;