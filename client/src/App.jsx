import { useState } from "react";
import EventCreation from "./components/EventCreation";
import EventPreview from "./components/EventPreview";

function App() {
  const [event, setEvent] = useState(null);

  return (
    <div>
      <h1>Vento</h1>

      <EventCreation event={event} onCreated={setEvent} />
      {event && <EventPreview event={event} />}
      
    </div>
  );
}

export default App;