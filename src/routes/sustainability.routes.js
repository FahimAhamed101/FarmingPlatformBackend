const express = require("express");
const { body } = require("express-validator");

const {
  submitCertification,
  listMyCertifications,
  listVendorCertifications,
} = require("../controllers/sustainability.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/sustainability-certs/me:
 *   get:
 *     summary: Get current vendor's certifications
 *     tags: [Sustainability]
 */
router.post(
  "/sustainability-certs",
  protect,
  authorize("vendor"),
  [
    body("certifyingAgency").isString().trim().notEmpty(),
    body("certificationDate").isISO8601(),
    body("certificateId").isString().trim().notEmpty(),
    body("documentUrl").optional().isURL(),
  ],
  validate,
  submitCertification
);

router.get("/sustainability-certs/me", protect, authorize("vendor"), listMyCertifications);
router.get("/sustainability-certs/vendor/:vendorId", listVendorCertifications);

module.exports = router;
