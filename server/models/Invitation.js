const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    coupleNames: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
    },

    language: {
      type: String,
      enum: ["ar", "en"],
      default: "en",
    },

    theme: {
      type: String,
      required: true,
      default: "classic-rose",
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "unpublished", "deleted"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);