const invitationRepository = require("../repositories/invitationRepository");

const createInvitation = async (invitationData) => {


  
  return await invitationRepository.createInvitation(invitationData);
};

module.exports = {
  createInvitation,
};