const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    guestName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["attending", "not-attending"],
    },

    guestCount: {
      type: Number,
      required: true,
      min: 0,
    },

    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RSVP", rsvpSchema);