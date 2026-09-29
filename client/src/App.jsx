import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import EventCreation from "./components/EventCreation";
import EventPreview from "./components/EventPreview";
import PublicInvitation from "./pages/PublicInvitation";

function App() {
  const [event, setEvent] = useState(null);

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <h1>Vento</h1>

          <EventCreation event={event} onCreated={setEvent} />
          {event && <EventPreview event={event} onPublished={setEvent} />}

        </div>
      }
    />
      <Route path="/invite/:eventType/:slug" element={<PublicInvitation />} />
    </Routes>
  );
}

export default App;