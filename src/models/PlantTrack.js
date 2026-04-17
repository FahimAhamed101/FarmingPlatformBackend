const mongoose = require("mongoose");

const plantUpdateSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    stage: {
      type: String,
      enum: ["seeded", "germination", "vegetative", "flowering", "harvested"],
      default: "seeded",
    },
    healthStatus: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "diseased"],
      default: "good",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const plantTrackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    rentalSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalSpace",
      default: null,
    },
    plantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    stage: {
      type: String,
      enum: ["seeded", "germination", "vegetative", "flowering", "harvested"],
      default: "seeded",
    },
    healthStatus: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "diseased"],
      default: "good",
    },
    expectedHarvestDate: {
      type: Date,
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    updates: {
      type: [plantUpdateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PlantTrack", plantTrackSchema);
