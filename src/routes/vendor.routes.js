const express = require("express");
const { body } = require("express-validator");

const {
  upsertVendorProfile,
  getMyVendorProfile,
  getVendors,
  getVendorById,
} = require("../controllers/vendor.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get public vendor profiles
 *     tags: [Vendors]
 */
router.get("/vendors", getVendors);
router.get("/vendors/:vendorId", getVendorById);

router.get("/vendors/me/profile", protect, authorize("vendor"), getMyVendorProfile);

router.put(
  "/vendors/me/profile",
  protect,
  authorize("vendor"),
  [
    body("farmName").optional().isString().trim().notEmpty(),
    body("farmLocation").optional().isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("latitude").optional().isFloat({ min: -90, max: 90 }).toFloat(),
    body("longitude").optional().isFloat({ min: -180, max: 180 }).toFloat(),
  ],
  validate,
  upsertVendorProfile
);

module.exports = router;
