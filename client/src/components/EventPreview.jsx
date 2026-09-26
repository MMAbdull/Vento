function EventPreview({ event }) {
  return (
    <div>
      <h2>Event Created!</h2>

      <p>ID: {event._id}</p>
      <p>Event Type: {event.eventType}</p>
      <p>Title: {event.title}</p>
      <p>Date: {event.date}</p>
      <p>Time: {event.time}</p>
      <p>Venue: {event.venue}</p>
      <p>Theme: {event.theme}</p>
      <p>Status: {event.status}</p>
    </div>
  );
}

export default EventPreview;