const { StatusCodes } = require("http-status-codes");

const PlantTrack = require("../models/PlantTrack");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const { getSocketServer } = require("../config/socket");

const canAccessPlant = (user, plantTrack) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "customer" && plantTrack.userId?.toString() === user._id.toString()) {
    return true;
  }

  if (user.role === "vendor" && plantTrack.vendorId?.toString() === user._id.toString()) {
    return true;
  }

  return false;
};

const emitPlantUpdate = (eventName, plantTrack, note) => {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  const payload = {
    event: eventName,
    plantId: plantTrack._id,
    plantName: plantTrack.plantName,
    stage: plantTrack.stage,
    healthStatus: plantTrack.healthStatus,
    lastUpdatedAt: plantTrack.lastUpdatedAt,
    note,
  };

  io.emit("plant:update", payload);
  io.to(`plant:${plantTrack._id}`).emit("plant:update", payload);
};

const createPlantTrack = asyncHandler(async (req, res) => {
  const ownerUserId = req.user.role === "customer" ? req.user._id : req.body.userId || req.user._id;
  const vendorId = req.user.role === "vendor" ? req.user._id : req.body.vendorId || null;

  const plantTrack = await PlantTrack.create({
    userId: ownerUserId,
    vendorId,
    rentalSpaceId: req.body.rentalSpaceId || null,
    plantName: req.body.plantName,
    stage: req.body.stage,
    healthStatus: req.body.healthStatus,
    expectedHarvestDate: req.body.expectedHarvestDate,
    updates: req.body.initialNote
      ? [
          {
            note: req.body.initialNote,
            stage: req.body.stage || "seeded",
            healthStatus: req.body.healthStatus || "good",
          },
        ]
      : [],
    lastUpdatedAt: new Date(),
  });

  emitPlantUpdate("plant_created", plantTrack, req.body.initialNote || "Plant tracking started");

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Plant tracking created successfully.",
    data: plantTrack,
  });
});

const listPlantTracks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.user.role === "customer") {
    filter.userId = req.user._id;
  }

  if (req.user.role === "vendor") {
    filter.vendorId = req.user._id;
  }

  const [plantTracks, total] = await Promise.all([
    PlantTrack.find(filter)
      .populate("userId", "name email")
      .populate("vendorId", "name email")
      .populate("rentalSpaceId", "locationLabel")
      .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit),
    PlantTrack.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Plant tracking records fetched successfully.",
    data: plantTracks,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const getPlantTrackById = asyncHandler(async (req, res) => {
  const plantTrack = await PlantTrack.findById(req.params.plantId)
    .populate("userId", "name email")
    .populate("vendorId", "name email")
    .populate("rentalSpaceId", "locationLabel");

  if (!plantTrack) {
    const error = new Error("Plant tracking record not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PLANT_TRACK_NOT_FOUND";
    throw error;
  }

  if (!canAccessPlant(req.user, plantTrack)) {
    const error = new Error("You cannot access this plant tracking record.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  return sendSuccess(res, {
    message: "Plant tracking details fetched successfully.",
    data: plantTrack,
  });
});

const updatePlantTrack = asyncHandler(async (req, res) => {
  const plantTrack = await PlantTrack.findById(req.params.plantId);

  if (!plantTrack) {
    const error = new Error("Plant tracking record not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PLANT_TRACK_NOT_FOUND";
    throw error;
  }

  if (!canAccessPlant(req.user, plantTrack)) {
    const error = new Error("You cannot update this plant tracking record.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  ["plantName", "stage", "healthStatus", "expectedHarvestDate"].forEach((field) => {
    if (req.body[field] !== undefined) {
      plantTrack[field] = req.body[field];
    }
  });

  plantTrack.lastUpdatedAt = new Date();
  await plantTrack.save();

  emitPlantUpdate("plant_updated", plantTrack, "Plant profile updated");

  return sendSuccess(res, {
    message: "Plant tracking record updated successfully.",
    data: plantTrack,
  });
});

const addPlantUpdate = asyncHandler(async (req, res) => {
  const plantTrack = await PlantTrack.findById(req.params.plantId);

  if (!plantTrack) {
    const error = new Error("Plant tracking record not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PLANT_TRACK_NOT_FOUND";
    throw error;
  }

  if (!canAccessPlant(req.user, plantTrack)) {
    const error = new Error("You cannot update this plant tracking record.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  const updateEntry = {
    note: req.body.note,
    stage: req.body.stage || plantTrack.stage,
    healthStatus: req.body.healthStatus || plantTrack.healthStatus,
  };

  plantTrack.updates.push(updateEntry);

  if (req.body.stage) {
    plantTrack.stage = req.body.stage;
  }

  if (req.body.healthStatus) {
    plantTrack.healthStatus = req.body.healthStatus;
  }

  plantTrack.lastUpdatedAt = new Date();
  await plantTrack.save();

  emitPlantUpdate("plant_progress", plantTrack, req.body.note);

  return sendSuccess(res, {
    message: "Plant update added successfully.",
    data: plantTrack,
  });
});

module.exports = {
  createPlantTrack,
  listPlantTracks,
  getPlantTrackById,
  updatePlantTrack,
  addPlantUpdate,
};
