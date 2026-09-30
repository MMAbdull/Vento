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
        <p className="classic-rose__label">You're Invited</p>

        <h1 className="classic-rose__title">{event.title}</h1>

        <div className="classic-rose__details">
          <p className="classic-rose__date">{formattedDate}</p>
          <p className="classic-rose__time">{event.time}</p>
          <p className="classic-rose__venue">{event.venue}</p>
        </div>

        

        {event.message && <p className="classic-rose__message">{event.message}</p>}
      </section>
    </main>
  );
}

export default ClassicRose;