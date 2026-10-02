import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getEventById } from "../api/eventApi";
import EventPreview from "../components/EventPreview";

function EventManagement() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const result = await getEventById(id);
        setEvent(result.data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchEvent();
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!event) {
    return <p>Loading event...</p>;
  }

  return (
    <EventPreview event={event} onPublished={setEvent} />
  );
}

export default EventManagement;