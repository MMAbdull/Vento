const API_URL = import.meta.env.VITE_API_URL;

const createEvent = async (eventData) => {
  const response = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create event");
  }

  return data;
};

const getEventById = async (id) => {
  const response = await fetch(`${API_URL}/api/events/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get event");
  }

  return data;
};

const updateEvent = async (id, eventData) => {
  const response = await fetch(`${API_URL}/api/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update event");
  }

  return data;
};

export { createEvent, getEventById, updateEvent };