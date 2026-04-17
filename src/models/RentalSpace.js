const mongoose = require("mongoose");

const rentalSpaceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    locationLabel: {
      type: String,
      required: true,
      trim: true,
    },
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    availability: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

rentalSpaceSchema.index({ geoLocation: "2dsphere" });

module.exports = mongoose.model("RentalSpace", rentalSpaceSchema);
