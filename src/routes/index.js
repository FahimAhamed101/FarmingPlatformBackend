const express = require("express");

const authRoutes = require("./auth.routes");
const vendorRoutes = require("./vendor.routes");
const produceRoutes = require("./produce.routes");
const rentalRoutes = require("./rental.routes");
const orderRoutes = require("./order.routes");
const communityRoutes = require("./community.routes");
const sustainabilityRoutes = require("./sustainability.routes");
const plantRoutes = require("./plant.routes");
const adminRoutes = require("./admin.routes");
const { sendSuccess } = require("../utils/apiResponse");

const router = express.Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API root endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API metadata
 */
router.get("/", (_req, res) => {
  return sendSuccess(res, {
    message: "Urban farming API root.",
    data: {
      version: "1.0.0",
      docs: "/api/docs",
      modules: [
        "auth",
        "vendors",
        "produce",
        "rental-spaces",
        "orders",
        "community-posts",
        "sustainability-certs",
        "plants",
        "admin",
      ],
    },
  });
});

router.use(authRoutes);
router.use(vendorRoutes);
router.use(produceRoutes);
router.use(rentalRoutes);
router.use(orderRoutes);
router.use(communityRoutes);
router.use(sustainabilityRoutes);
router.use(plantRoutes);
router.use(adminRoutes);

module.exports = router;
