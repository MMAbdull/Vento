const invitationRepository = require("../repositories/invitationRepository");

const createInvitation = async (invitationData) => {  
  return await invitationRepository.createInvitation(invitationData);
};

const findInvitationById = async (id) => {
  return await invitationRepository.findInvitationById(id);
};

module.exports = {
  createInvitation,
  findInvitationById,
};