const { StatusCodes } = require("http-status-codes");

const SustainabilityCert = require("../models/SustainabilityCert");
const VendorProfile = require("../models/VendorProfile");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const submitCertification = asyncHandler(async (req, res) => {
  const cert = await SustainabilityCert.create({
    vendorId: req.user._id,
    certifyingAgency: req.body.certifyingAgency,
    certificationDate: req.body.certificationDate,
    certificateId: req.body.certificateId,
    documentUrl: req.body.documentUrl,
    status: "pending",
  });

  await VendorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { certificationStatus: "pending" },
    { new: true }
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Certification submitted successfully.",
    data: cert,
  });
});

const listMyCertifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [certs, total] = await Promise.all([
    SustainabilityCert.find({ vendorId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SustainabilityCert.countDocuments({ vendorId: req.user._id }),
  ]);

  return sendSuccess(res, {
    message: "Your certifications fetched successfully.",
    data: certs,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const listVendorCertifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const vendorProfile = await VendorProfile.findOne({ userId: req.params.vendorId });
  if (!vendorProfile) {
    const error = new Error("Vendor profile not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "VENDOR_PROFILE_NOT_FOUND";
    throw error;
  }

  const filter = {
    vendorId: req.params.vendorId,
    status: req.query.status || "approved",
  };

  const [certs, total] = await Promise.all([
    SustainabilityCert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SustainabilityCert.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Vendor certifications fetched successfully.",
    data: certs,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

module.exports = {
  submitCertification,
  listMyCertifications,
  listVendorCertifications,
};
