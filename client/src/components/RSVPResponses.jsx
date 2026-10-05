import { useEffect, useState } from "react";
import { getRSVPsByEvent } from "../api/rsvpApi";
import "../styles/components/RSVPResponses.css";

function RSVPResponses({ eventId }) {
  const [rsvps, setRsvps] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRSVPs = async () => {
      try {
        const result = await getRSVPsByEvent(eventId);

        if (isMounted) {
          setRsvps(result.data);
          setError("");
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    fetchRSVPs();

    const interval = setInterval(fetchRSVPs, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <p className="rsvp-responses__loading">
        Loading RSVP responses...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rsvp-responses__error">
        {error}
      </p>
    );
  }

  return (
    <section className="rsvp-responses">
      <div className="rsvp-responses__header">
        <h2>RSVP Responses</h2>
        <p>Keep track of your guests' responses.</p>
      </div>

      {rsvps.length === 0 ? (
        <p className="rsvp-responses__empty">
          No RSVP responses yet.
        </p>
      ) : (
        <div className="rsvp-responses__list">
          {rsvps.map((rsvp) => (
            <article
              className="rsvp-responses__item"
              key={rsvp._id}
            >
              <h3 className="rsvp-responses__guest">
                {rsvp.guestName}
              </h3>

              <div className="rsvp-responses__details">
                <span
                  className={`rsvp-responses__badge ${
                    rsvp.status === "attending"
                      ? "rsvp-responses__badge--attending"
                      : "rsvp-responses__badge--not-attending"
                  }`}
                >
                  {rsvp.status === "attending"
                    ? "Attending"
                    : "Not Attending"}
                </span>

                <span className="rsvp-responses__badge">
                  {rsvp.guestCount}{" "}
                  {rsvp.guestCount === 1 ? "Guest" : "Guests"}
                </span>
              </div>

              {rsvp.message && (
                <p className="rsvp-responses__message">
                  {rsvp.message}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default RSVPResponses;