import { useEffect, useState } from "react";
import { getRSVPsByEvent } from "../api/rsvpApi";

function RSVPResponses({ eventId }) {
  const [rsvps, setRsvps] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        setError("");

        const result = await getRSVPsByEvent(eventId);

        setRsvps(result.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRSVPs();
  }, [eventId]);

  if (isLoading) {
    return <p>Loading RSVP responses...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section>
      <h2>RSVP Responses</h2>

      {rsvps.length === 0 ? (
        <p>No RSVP responses yet.</p>
      ) : (
        <div>
          {rsvps.map((rsvp) => (
            <article key={rsvp._id}>
              <h3>{rsvp.guestName}</h3>

              <p>
                Status:{" "}
                {rsvp.status === "attending"
                  ? "Attending"
                  : "Not Attending"}
              </p>

              <p>Guests: {rsvp.guestCount}</p>

              {rsvp.message && <p>Message: {rsvp.message}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default RSVPResponses;