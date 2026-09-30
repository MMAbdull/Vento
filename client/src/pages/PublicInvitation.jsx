import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventBySlug } from "../api/eventApi";
import ClassicRose from "../themes/classic-rose/ClassicRose";

const themes = {
  "classic-rose": ClassicRose,
}

function PublicInvitation() {
  const { slug } = useParams();

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

  const Theme = themes[event.theme];

  if (!Theme) {
    return <p>Theme not found</p>;
  }

  return <Theme event={event} />;
}

export default PublicInvitation;