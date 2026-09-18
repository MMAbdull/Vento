const invitation = require("../models/Invitation");

const createInvitation = async (invitationData) => {
  return await invitation.create(invitationData);
}

module.exports = {
  createInvitation,
};