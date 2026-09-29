import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventBySlug } from "../api/eventApi";

function PublicInvitation() {
  const { eventType, slug } = useParams();

  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const result = await getEventBySlug(slug);
        setEvent(result.data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchEvent();
  }, [slug]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!event) {
    return <p>Loading invitation...</p>;
  }

  return (
    <div>
      <h1>Public Invitation Page</h1>

      <p>Event Type: {eventType}</p>
      <p>Title: {event.title}</p>
      <p>Date: {event.date}</p>
      <p>Time: {event.time}</p>
      <p>Venue: {event.venue}</p>
      <p>Message: {event.message}</p>
    </div>
  );
}

export default PublicInvitation;