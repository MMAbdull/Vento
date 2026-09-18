const invitationService = require("../services/invitationService");

const createInvitation = async (req, res) => {
  try {
    const invitation = await invitationService.createInvitation(req.body);
    res.status(201).json({
      success: "true",
      data: invitation,
    });
  } catch (error) {
    res.status(400).json({
      success: "false",
      message: error.message,
    });
  }
};

module.exports = {
  createInvitation,
};