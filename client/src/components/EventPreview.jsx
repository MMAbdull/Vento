import { useState } from "react";
import { publishEvent } from "../api/eventApi";
import ClassicRose from "../themes/classic-rose/ClassicRose";

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

      <ClassicRose event={event} />

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