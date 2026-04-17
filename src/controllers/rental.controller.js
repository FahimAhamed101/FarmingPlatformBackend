const { StatusCodes } = require("http-status-codes");

const RentalSpace = require("../models/RentalSpace");
const RentalBooking = require("../models/RentalBooking");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const createRentalSpace = asyncHandler(async (req, res) => {
  const { locationLabel, latitude, longitude, size, price, availability, description } = req.body;

  const rentalSpace = await RentalSpace.create({
    vendorId: req.user._id,
    locationLabel,
    geoLocation: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    size,
    price,
    availability,
    description,
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Rental space created successfully.",
    data: rentalSpace,
  });
});

const listRentalSpaces = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { availability, latitude, longitude, radiusKm } = req.query;

  const filter = {};

  if (availability !== undefined) {
    filter.availability = availability === "true";
  }

  if (latitude && longitude) {
    filter.geoLocation = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: (Number(radiusKm) || 5) * 1000,
      },
    };
  }

  const [spaces, total] = await Promise.all([
    RentalSpace.find(filter)
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RentalSpace.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Rental spaces fetched successfully.",
    data: spaces,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const updateRentalSpace = asyncHandler(async (req, res) => {
  const rentalSpace = await RentalSpace.findById(req.params.rentalSpaceId);

  if (!rentalSpace) {
    const error = new Error("Rental space not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "RENTAL_SPACE_NOT_FOUND";
    throw error;
  }

  if (req.user.role === "vendor" && rentalSpace.vendorId.toString() !== req.user._id.toString()) {
    const error = new Error("You can only update your own rental spaces.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  const mutableFields = ["locationLabel", "size", "price", "availability", "description"];
  mutableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      rentalSpace[field] = req.body[field];
    }
  });

  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    if (typeof req.body.latitude !== "number" || typeof req.body.longitude !== "number") {
      const error = new Error("Latitude and longitude must both be numbers.");
      error.statusCode = StatusCodes.BAD_REQUEST;
      error.code = "INVALID_GEO_COORDINATES";
      throw error;
    }

    rentalSpace.geoLocation = {
      type: "Point",
      coordinates: [req.body.longitude, req.body.latitude],
    };
  }

  await rentalSpace.save();

  return sendSuccess(res, {
    message: "Rental space updated successfully.",
    data: rentalSpace,
  });
});

const bookRentalSpace = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  const rentalSpace = await RentalSpace.findById(req.params.rentalSpaceId);
  if (!rentalSpace) {
    const error = new Error("Rental space not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "RENTAL_SPACE_NOT_FOUND";
    throw error;
  }

  if (!rentalSpace.availability) {
    const error = new Error("Rental space is currently unavailable.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "RENTAL_SPACE_UNAVAILABLE";
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    const error = new Error("Booking dates are invalid.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_BOOKING_DATES";
    throw error;
  }

  const overlappingBooking = await RentalBooking.findOne({
    rentalSpaceId: rentalSpace._id,
    status: { $in: ["pending", "approved", "active"] },
    $or: [{ startDate: { $lt: end }, endDate: { $gt: start } }],
  });

  if (overlappingBooking) {
    const error = new Error("This rental space is already booked for the selected time range.");
    error.statusCode = StatusCodes.CONFLICT;
    error.code = "BOOKING_CONFLICT";
    throw error;
  }

  const booking = await RentalBooking.create({
    userId: req.user._id,
    vendorId: rentalSpace.vendorId,
    rentalSpaceId: rentalSpace._id,
    startDate: start,
    endDate: end,
    status: "pending",
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Rental booking submitted successfully.",
    data: booking,
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [bookings, total] = await Promise.all([
    RentalBooking.find({ userId: req.user._id })
      .populate("rentalSpaceId", "locationLabel price size")
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RentalBooking.countDocuments({ userId: req.user._id }),
  ]);

  return sendSuccess(res, {
    message: "Your bookings fetched successfully.",
    data: bookings,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const getVendorBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [bookings, total] = await Promise.all([
    RentalBooking.find({ vendorId: req.user._id })
      .populate("rentalSpaceId", "locationLabel price size")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RentalBooking.countDocuments({ vendorId: req.user._id }),
  ]);

  return sendSuccess(res, {
    message: "Vendor bookings fetched successfully.",
    data: bookings,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await RentalBooking.findById(req.params.bookingId);
  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "BOOKING_NOT_FOUND";
    throw error;
  }

  if (req.user.role === "vendor" && booking.vendorId.toString() !== req.user._id.toString()) {
    const error = new Error("You can only manage bookings tied to your rental spaces.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  booking.status = status;
  await booking.save();

  if (["approved", "active"].includes(status)) {
    await RentalSpace.findByIdAndUpdate(booking.rentalSpaceId, { availability: false });
  }

  if (["completed", "cancelled", "rejected"].includes(status)) {
    await RentalSpace.findByIdAndUpdate(booking.rentalSpaceId, { availability: true });
  }

  return sendSuccess(res, {
    message: "Booking status updated successfully.",
    data: booking,
  });
});

module.exports = {
  createRentalSpace,
  listRentalSpaces,
  updateRentalSpace,
  bookRentalSpace,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
};
