const API_URL = import.meta.env.VITE_API_URL;

const createInvitation = async (invitationData) => {
  const response = await fetch(`${API_URL}/api/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(invitationData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create invitation");
  }

  return data;
};

const getInvitationById = async (id) => {
  const response = await fetch(`${API_URL}/api/invitations/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get invitation");
  }

  return data;
};

export { createInvitation, getInvitationById };