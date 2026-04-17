const mongoose = require("mongoose");

const vendorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    farmName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    certificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    farmLocation: {
      type: String,
      required: true,
      trim: true,
    },
    farmGeo: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

vendorProfileSchema.index({ farmGeo: "2dsphere" });

module.exports = mongoose.model("VendorProfile", vendorProfileSchema);
