const express = require("express");
const { body } = require("express-validator");

const { createOrder, listOrders, updateOrderStatus } = require("../controllers/order.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders with role-aware filtering
 *     tags: [Orders]
 *   post:
 *     summary: Create order (Customer)
 *     tags: [Orders]
 */
router.post(
  "/orders",
  protect,
  authorize("customer"),
  [body("produceId").isMongoId(), body("quantity").isInt({ min: 1 }).toInt()],
  validate,
  createOrder
);

router.get("/orders", protect, authorize("customer", "vendor", "admin"), listOrders);

router.patch(
  "/orders/:orderId/status",
  protect,
  authorize("vendor", "admin"),
  [body("status").isIn(["pending", "confirmed", "cancelled", "delivered"])],
  validate,
  updateOrderStatus
);

module.exports = router;
