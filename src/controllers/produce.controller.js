const { StatusCodes } = require("http-status-codes");

const Produce = require("../models/Produce");
const VendorProfile = require("../models/VendorProfile");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const createProduce = asyncHandler(async (req, res) => {
  const vendorProfile = await VendorProfile.findOne({ userId: req.user._id });

  if (!vendorProfile) {
    const error = new Error("Vendor profile is required before listing products.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "VENDOR_PROFILE_REQUIRED";
    throw error;
  }

  const produce = await Produce.create({
    vendorId: req.user._id,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    availableQuantity: req.body.availableQuantity,
    certificationStatus: "pending",
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Produce created and pending certification review.",
    data: produce,
  });
});

const listProduce = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { category, q, vendorId, certificationStatus } = req.query;

  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (vendorId) {
    filter.vendorId = vendorId;
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (certificationStatus) {
    filter.certificationStatus = certificationStatus;
  } else {
    filter.certificationStatus = "approved";
  }

  const [items, total] = await Promise.all([
    Produce.find(filter)
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Produce.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Produce list fetched successfully.",
    data: items,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const getProduceById = asyncHandler(async (req, res) => {
  const produce = await Produce.findById(req.params.produceId).populate("vendorId", "name email");

  if (!produce || !produce.isActive) {
    const error = new Error("Produce item not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PRODUCE_NOT_FOUND";
    throw error;
  }

  return sendSuccess(res, {
    message: "Produce details fetched successfully.",
    data: produce,
  });
});

const updateProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findById(req.params.produceId);

  if (!produce || !produce.isActive) {
    const error = new Error("Produce item not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PRODUCE_NOT_FOUND";
    throw error;
  }

  if (req.user.role === "vendor" && produce.vendorId.toString() !== req.user._id.toString()) {
    const error = new Error("You can only update your own produce listings.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  const mutableFields = ["name", "description", "price", "category", "availableQuantity", "isActive"];
  mutableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      produce[field] = req.body[field];
    }
  });

  if (req.user.role === "vendor") {
    produce.certificationStatus = "pending";
  }

  await produce.save();

  return sendSuccess(res, {
    message: "Produce updated successfully.",
    data: produce,
  });
});

const deleteProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findById(req.params.produceId);

  if (!produce || !produce.isActive) {
    const error = new Error("Produce item not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PRODUCE_NOT_FOUND";
    throw error;
  }

  if (req.user.role === "vendor" && produce.vendorId.toString() !== req.user._id.toString()) {
    const error = new Error("You can only remove your own produce listings.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  produce.isActive = false;
  await produce.save();

  return sendSuccess(res, {
    message: "Produce removed successfully.",
    data: produce,
  });
});

module.exports = {
  createProduce,
  listProduce,
  getProduceById,
  updateProduce,
  deleteProduce,
};
