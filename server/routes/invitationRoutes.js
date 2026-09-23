const express = require("express");

const { createInvitation, getInvitationById} = require("../controllers/invitationController");

const router = express.Router();

router.post("/", createInvitation);
router.get("/:id", getInvitationById);

module.exports = router;