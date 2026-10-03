import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import EventCreation from "./components/EventCreation";
import EventPreview from "./components/EventPreview";
import PublicInvitation from "./pages/PublicInvitation";
import EventManagement from "./pages/EventManagement";

function App() {
  const [event, setEvent] = useState(null);
  const [draftEvent, setDraftEvent] = useState(null);

  const handleEventSaved = (eventData) => {
    setEvent(eventData);
    setDraftEvent(eventData);
  };

  const handleEventPublished = (eventData) => {
    setEvent(eventData);
    setDraftEvent(eventData);
  }

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <h1>Vento</h1>

          <EventCreation event={event} onCreated={handleEventSaved} onFormChange={setDraftEvent} />
          {event && <EventPreview event={draftEvent || event} onPublished={handleEventPublished} />}

        </div>
      }
    />
      <Route path="/event/:id" element={<EventManagement />} />
      <Route path="/invite/:eventType/:slug" element={<PublicInvitation />} />
    </Routes>
  );
}

export default App;