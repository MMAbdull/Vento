import { useState } from "react";
import { publishEvent } from "../api/eventApi";
import ClassicRose from "../themes/classic-rose/ClassicRose";
import RSVPResponses from "./RSVPResponses";

function EventPreview({ event, onPublished }) {
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/invite/${event.eventType}/${event.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      setError("Failed to copy the link. Please try again.");
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
        <div>
          <p>Event Published!</p>

          <p>
            Your invitation link:
          </p>

          <a
            href={`/invite/${event.eventType}/${event.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            {window.location.origin}/invite/{event.eventType}/{event.slug}
          </a>

          <button type="button" onClick={handleCopyLink}>
            {isCopied ? "Link Copied!" : "Copy Link"}
          </button>
        </div>
      )}

      {error && <p>{error}</p>}

      <RSVPResponses eventId={event._id} />
    </div>
  );
}

export default EventPreview;