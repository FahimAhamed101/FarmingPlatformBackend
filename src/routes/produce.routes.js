const express = require("express");
const { body } = require("express-validator");

const {
  createProduce,
  listProduce,
  getProduceById,
  updateProduce,
  deleteProduce,
} = require("../controllers/produce.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/produce:
 *   get:
 *     summary: List produce items
 *     tags: [Marketplace]
 *   post:
 *     summary: Create produce listing (Vendor)
 *     tags: [Marketplace]
 */
router.get("/produce", listProduce);
router.get("/produce/:produceId", getProduceById);

router.post(
  "/produce",
  protect,
  authorize("vendor"),
  [
    body("name").isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("price").isFloat({ min: 0 }).toFloat(),
    body("category").isIn(["seeds", "tools", "organic-produce", "compost", "fertilizer", "other"]),
    body("availableQuantity").isInt({ min: 0 }).toInt(),
  ],
  validate,
  createProduce
);

router.patch(
  "/produce/:produceId",
  protect,
  authorize("vendor", "admin"),
  [
    body("name").optional().isString().trim().notEmpty(),
    body("description").optional().isString(),
    body("price").optional().isFloat({ min: 0 }).toFloat(),
    body("category")
      .optional()
      .isIn(["seeds", "tools", "organic-produce", "compost", "fertilizer", "other"]),
    body("availableQuantity").optional().isInt({ min: 0 }).toInt(),
    body("isActive").optional().isBoolean(),
  ],
  validate,
  updateProduce
);

router.delete("/produce/:produceId", protect, authorize("vendor", "admin"), deleteProduce);

module.exports = router;
