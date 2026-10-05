import "./ClassicRose.css";

function ClassicRose({ event }) {
  const formattedDate = new Date(event.date).toLocaleDateString(
    event.language === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <main className="classic-rose">
      <section className="classic-rose__card">
        <div className="classic-rose__ornament">
          ♡
        </div>

        <p className="classic-rose__label">
          You're Invited
        </p>

        <h1 className="classic-rose__title">
          {event.title}
        </h1>

        <div className="classic-rose__divider">
          <span />
          <span>✦</span>
          <span />
        </div>

        <div className="classic-rose__details">
          <div className="classic-rose__detail">
            <span className="classic-rose__detail-label">
              Date
            </span>

            <p>{formattedDate}</p>
          </div>

          <div className="classic-rose__detail">
            <span className="classic-rose__detail-label">
              Time
            </span>

            <p>{event.time}</p>
          </div>

          <div className="classic-rose__detail">
            <span className="classic-rose__detail-label">
              Venue
            </span>

            <p>{event.venue}</p>
          </div>
        </div>

        {event.message && (
          <p className="classic-rose__message">
            {event.message}
          </p>
        )}
      </section>
    </main>
  );
}

export default ClassicRose;