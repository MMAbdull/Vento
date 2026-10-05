import { useState } from "react";
import { publishEvent } from "../api/eventApi";
import ClassicRose from "../themes/classic-rose/ClassicRose";
import RSVPResponses from "./RSVPResponses";
import "../styles/components/EventPreview.css";

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
    <div className="event-preview">
      <div className="event-preview__header">
        <h2>Event Preview</h2>
        <p>Preview your invitation before sharing it with your guests.</p>
      </div>

      <ClassicRose event={event} />

      {event.status === "draft" && (
        <div className="event-preview__publish">
          <button
            className="event-preview__publish-button"
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing..." : "Publish Event"}
          </button>
        </div>
      )}

      {event.status === "published" && (
        <div className="event-preview__published">
          <p className="event-preview__published-title">
            Event Published!
          </p>

          <p className="event-preview__published-text">
            Your invitation is ready to share with your guests.
          </p>

          <a
            className="event-preview__link"
            href={`/invite/${event.eventType}/${event.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            {window.location.origin}/invite/{event.eventType}/{event.slug}
          </a>

          <button
            className="event-preview__copy-button"
            type="button"
            onClick={handleCopyLink}
          >
            {isCopied ? "Link Copied!" : "Copy Link"}
          </button>
        </div>
      )}

      {error && <p className="event-preview__error">{error}</p>}

      <RSVPResponses eventId={event._id} />
    </div>
  );
}

export default EventPreview;