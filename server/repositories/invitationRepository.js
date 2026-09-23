const invitation = require("../models/Invitation");

const createInvitation = async (invitationData) => {
  return await invitation.create(invitationData);
}

const findInvitationById = async (id) => {
  return await invitation.findById(id);
}

module.exports = {
  createInvitation,
  findInvitationById,
};