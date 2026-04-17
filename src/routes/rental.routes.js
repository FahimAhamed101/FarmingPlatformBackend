const express = require("express");
const { body } = require("express-validator");

const {
  createRentalSpace,
  listRentalSpaces,
  updateRentalSpace,
  bookRentalSpace,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
} = require("../controllers/rental.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/rental-spaces:
 *   get:
 *     summary: List rental spaces (supports location-based search)
 *     tags: [Rental]
 */
router.get("/rental-spaces", listRentalSpaces);

router.post(
  "/rental-spaces",
  protect,
  authorize("vendor"),
  [
    body("locationLabel").isString().trim().notEmpty(),
    body("latitude").isFloat({ min: -90, max: 90 }).toFloat(),
    body("longitude").isFloat({ min: -180, max: 180 }).toFloat(),
    body("size").isFloat({ min: 1 }).toFloat(),
    body("price").isFloat({ min: 0 }).toFloat(),
    body("availability").optional().isBoolean(),
    body("description").optional().isString(),
  ],
  validate,
  createRentalSpace
);

router.patch(
  "/rental-spaces/:rentalSpaceId",
  protect,
  authorize("vendor", "admin"),
  [
    body("locationLabel").optional().isString().trim().notEmpty(),
    body("latitude").optional().isFloat({ min: -90, max: 90 }).toFloat(),
    body("longitude").optional().isFloat({ min: -180, max: 180 }).toFloat(),
    body("size").optional().isFloat({ min: 1 }).toFloat(),
    body("price").optional().isFloat({ min: 0 }).toFloat(),
    body("availability").optional().isBoolean(),
    body("description").optional().isString(),
  ],
  validate,
  updateRentalSpace
);

router.post(
  "/rental-spaces/:rentalSpaceId/book",
  protect,
  authorize("customer"),
  [body("startDate").isISO8601(), body("endDate").isISO8601()],
  validate,
  bookRentalSpace
);

router.get("/rental-spaces/bookings/me", protect, authorize("customer"), getMyBookings);
router.get("/rental-spaces/bookings/vendor", protect, authorize("vendor"), getVendorBookings);

router.patch(
  "/rental-spaces/bookings/:bookingId/status",
  protect,
  authorize("vendor", "admin"),
  [body("status").isIn(["pending", "approved", "rejected", "cancelled", "active", "completed"])],
  validate,
  updateBookingStatus
);

module.exports = router;
