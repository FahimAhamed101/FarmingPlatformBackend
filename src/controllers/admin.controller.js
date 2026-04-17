const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const VendorProfile = require("../models/VendorProfile");
const SustainabilityCert = require("../models/SustainabilityCert");
const Produce = require("../models/Produce");
const RentalSpace = require("../models/RentalSpace");
const Order = require("../models/Order");
const CommunityPost = require("../models/CommunityPost");
const PlantTrack = require("../models/PlantTrack");

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalVendors,
    pendingVendors,
    totalProduce,
    pendingProduce,
    totalRentalSpaces,
    totalOrders,
    totalPosts,
    totalPlantTracks,
    pendingCertifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "vendor" }),
    VendorProfile.countDocuments({ certificationStatus: "pending" }),
    Produce.countDocuments(),
    Produce.countDocuments({ certificationStatus: "pending" }),
    RentalSpace.countDocuments(),
    Order.countDocuments(),
    CommunityPost.countDocuments(),
    PlantTrack.countDocuments(),
    SustainabilityCert.countDocuments({ status: "pending" }),
  ]);

  return sendSuccess(res, {
    message: "Admin dashboard metrics fetched successfully.",
    data: {
      totalUsers,
      totalVendors,
      pendingVendors,
      totalProduce,
      pendingProduce,
      totalRentalSpaces,
      totalOrders,
      totalPosts,
      totalPlantTracks,
      pendingCertifications,
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, status, q } = req.query;

  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  if (q) {
    filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Users fetched successfully.",
    data: users,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["active", "pending", "inactive", "suspended"].includes(status)) {
    const error = new Error("Invalid user status.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_USER_STATUS";
    throw error;
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  user.status = status;
  await user.save();

  return sendSuccess(res, {
    message: "User status updated successfully.",
    data: user,
  });
});

const reviewVendorCertification = asyncHandler(async (req, res) => {
  const { certificationStatus } = req.body;

  if (!["pending", "approved", "rejected"].includes(certificationStatus)) {
    const error = new Error("Invalid certification status.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_CERT_STATUS";
    throw error;
  }

  const vendorProfile = await VendorProfile.findOne({ userId: req.params.vendorId });
  if (!vendorProfile) {
    const error = new Error("Vendor profile not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "VENDOR_PROFILE_NOT_FOUND";
    throw error;
  }

  vendorProfile.certificationStatus = certificationStatus;
  await vendorProfile.save();

  const user = await User.findById(req.params.vendorId);
  if (user) {
    user.status = certificationStatus === "approved" ? "active" : "pending";
    await user.save();
  }

  return sendSuccess(res, {
    message: "Vendor certification status updated successfully.",
    data: vendorProfile,
  });
});

const reviewSustainabilityCertification = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    const error = new Error("Invalid certification review status.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_CERT_REVIEW_STATUS";
    throw error;
  }

  const cert = await SustainabilityCert.findById(req.params.certId);
  if (!cert) {
    const error = new Error("Certification record not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "CERTIFICATION_NOT_FOUND";
    throw error;
  }

  cert.status = status;
  cert.reviewNote = reviewNote || cert.reviewNote;
  cert.reviewedBy = req.user._id;
  await cert.save();

  await VendorProfile.findOneAndUpdate(
    { userId: cert.vendorId },
    {
      certificationStatus: status,
    },
    { new: true }
  );

  return sendSuccess(res, {
    message: "Sustainability certification reviewed successfully.",
    data: cert,
  });
});

const reviewProduceCertification = asyncHandler(async (req, res) => {
  const { certificationStatus } = req.body;

  if (!["approved", "rejected", "pending"].includes(certificationStatus)) {
    const error = new Error("Invalid produce certification status.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_PRODUCE_CERT_STATUS";
    throw error;
  }

  const produce = await Produce.findById(req.params.produceId);
  if (!produce) {
    const error = new Error("Produce item not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PRODUCE_NOT_FOUND";
    throw error;
  }

  produce.certificationStatus = certificationStatus;
  await produce.save();

  return sendSuccess(res, {
    message: "Produce certification updated successfully.",
    data: produce,
  });
});

module.exports = {
  getDashboard,
  listUsers,
  updateUserStatus,
  reviewVendorCertification,
  reviewSustainabilityCertification,
  reviewProduceCertification,
};
