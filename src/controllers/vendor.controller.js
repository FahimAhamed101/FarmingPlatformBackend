const { StatusCodes } = require("http-status-codes");

const VendorProfile = require("../models/VendorProfile");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const upsertVendorProfile = asyncHandler(async (req, res) => {
  const { farmName, farmLocation, description, latitude, longitude } = req.body;

  const update = {
    farmName,
    farmLocation,
    description,
  };

  Object.keys(update).forEach((key) => {
    if (update[key] === undefined) {
      delete update[key];
    }
  });

  if (latitude !== undefined || longitude !== undefined) {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      const error = new Error("Latitude and longitude must both be numbers.");
      error.statusCode = StatusCodes.BAD_REQUEST;
      error.code = "INVALID_GEO_COORDINATES";
      throw error;
    }

    update.farmGeo = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
  }

  const profile = await VendorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return sendSuccess(res, {
    message: "Vendor profile saved successfully.",
    data: profile,
  });
});

const getMyVendorProfile = asyncHandler(async (req, res) => {
  const profile = await VendorProfile.findOne({ userId: req.user._id }).populate("userId", "name email role status");

  if (!profile) {
    const error = new Error("Vendor profile not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "VENDOR_PROFILE_NOT_FOUND";
    throw error;
  }

  return sendSuccess(res, {
    message: "Vendor profile fetched successfully.",
    data: profile,
  });
});

const getVendors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { certificationStatus, q, latitude, longitude, radiusKm } = req.query;

  const filter = {};

  if (certificationStatus) {
    filter.certificationStatus = certificationStatus;
  } else {
    filter.certificationStatus = "approved";
  }

  if (q) {
    filter.$or = [
      { farmName: { $regex: q, $options: "i" } },
      { farmLocation: { $regex: q, $options: "i" } },
    ];
  }

  if (latitude && longitude) {
    filter.farmGeo = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: (Number(radiusKm) || 10) * 1000,
      },
    };
  }

  const [vendors, total] = await Promise.all([
    VendorProfile.find(filter)
      .populate("userId", "name email role status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    VendorProfile.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Vendors fetched successfully.",
    data: vendors,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const getVendorById = asyncHandler(async (req, res) => {
  const profile = await VendorProfile.findOne({ userId: req.params.vendorId }).populate(
    "userId",
    "name email role status"
  );

  if (!profile) {
    const error = new Error("Vendor profile not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "VENDOR_PROFILE_NOT_FOUND";
    throw error;
  }

  return sendSuccess(res, {
    message: "Vendor profile fetched successfully.",
    data: profile,
  });
});

module.exports = {
  upsertVendorProfile,
  getMyVendorProfile,
  getVendors,
  getVendorById,
};
