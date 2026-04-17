const mongoose = require("mongoose");

const sustainabilityCertSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    certifyingAgency: {
      type: String,
      required: true,
      trim: true,
    },
    certificationDate: {
      type: Date,
      required: true,
    },
    certificateId: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SustainabilityCert", sustainabilityCertSchema);
