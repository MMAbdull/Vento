const API_URL = import.meta.env.VITE_API_URL;

const createRSVP = async (eventId, rsvpData) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/rsvps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(rsvpData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create RSVP");
  }

  return data;
};

const getRSVPsByEvent = async (eventId) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/rsvps`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get RSVPs");
  }

  return data;
};

export { createRSVP, getRSVPsByEvent };
