const express = require("express");
const { body } = require("express-validator");

const { register, login, getCurrentUser } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");
const { protect } = require("../middlewares/auth");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer or vendor
 *     tags: [Auth]
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
router.post(
  "/auth/register",
  authLimiter,
  [
    body("name").isString().trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").optional().isIn(["vendor", "customer"]),
    body("farmName").optional().isString(),
    body("farmLocation").optional().isString(),
    body("latitude").optional().isFloat({ min: -90, max: 90 }).toFloat(),
    body("longitude").optional().isFloat({ min: -180, max: 180 }).toFloat(),
  ],
  validate,
  register
);

router.post(
  "/auth/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty()],
  validate,
  login
);

router.get("/auth/me", protect, getCurrentUser);

module.exports = router;
