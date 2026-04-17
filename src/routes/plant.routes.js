const express = require("express");
const { body } = require("express-validator");

const {
  createPlantTrack,
  listPlantTracks,
  getPlantTrackById,
  updatePlantTrack,
  addPlantUpdate,
} = require("../controllers/plant.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/plants:
 *   get:
 *     summary: List plant tracking records
 *     tags: [Plants]
 */
router.post(
  "/plants",
  protect,
  authorize("customer", "vendor", "admin"),
  [
    body("plantName").isString().trim().notEmpty(),
    body("userId").optional().isMongoId(),
    body("vendorId").optional().isMongoId(),
    body("rentalSpaceId").optional().isMongoId(),
    body("stage").optional().isIn(["seeded", "germination", "vegetative", "flowering", "harvested"]),
    body("healthStatus").optional().isIn(["excellent", "good", "fair", "poor", "diseased"]),
    body("expectedHarvestDate").optional().isISO8601(),
    body("initialNote").optional().isString(),
  ],
  validate,
  createPlantTrack
);

router.get("/plants", protect, authorize("customer", "vendor", "admin"), listPlantTracks);
router.get("/plants/:plantId", protect, authorize("customer", "vendor", "admin"), getPlantTrackById);

router.patch(
  "/plants/:plantId",
  protect,
  authorize("customer", "vendor", "admin"),
  [
    body("plantName").optional().isString().trim().notEmpty(),
    body("stage").optional().isIn(["seeded", "germination", "vegetative", "flowering", "harvested"]),
    body("healthStatus").optional().isIn(["excellent", "good", "fair", "poor", "diseased"]),
    body("expectedHarvestDate").optional().isISO8601(),
  ],
  validate,
  updatePlantTrack
);

router.post(
  "/plants/:plantId/updates",
  protect,
  authorize("customer", "vendor", "admin"),
  [
    body("note").isString().trim().notEmpty(),
    body("stage").optional().isIn(["seeded", "germination", "vegetative", "flowering", "harvested"]),
    body("healthStatus").optional().isIn(["excellent", "good", "fair", "poor", "diseased"]),
  ],
  validate,
  addPlantUpdate
);

module.exports = router;
