const express = require("express");
const { body } = require("express-validator");

const {
  getDashboard,
  listUsers,
  updateUserStatus,
  reviewVendorCertification,
  reviewSustainabilityCertification,
  reviewProduceCertification,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin platform metrics
 *     tags: [Admin]
 */
router.use("/admin", protect, authorize("admin"));

router.get("/admin/dashboard", getDashboard);
router.get("/admin/users", listUsers);

router.patch(
  "/admin/users/:userId/status",
  [body("status").isIn(["active", "pending", "inactive", "suspended"])],
  validate,
  updateUserStatus
);

router.patch(
  "/admin/vendors/:vendorId/certification",
  [body("certificationStatus").isIn(["pending", "approved", "rejected"])],
  validate,
  reviewVendorCertification
);

router.patch(
  "/admin/sustainability-certs/:certId/review",
  [body("status").isIn(["pending", "approved", "rejected"]), body("reviewNote").optional().isString()],
  validate,
  reviewSustainabilityCertification
);

router.patch(
  "/admin/produce/:produceId/certification",
  [body("certificationStatus").isIn(["pending", "approved", "rejected"])],
  validate,
  reviewProduceCertification
);

module.exports = router;
