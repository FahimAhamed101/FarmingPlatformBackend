const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const defaultHandler = (_req, res) => {
  return res.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    error: {
      code: "RATE_LIMIT_EXCEEDED",
    },
  });
};

const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: defaultHandler,
});

const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: defaultHandler,
});

module.exports = {
  globalLimiter,
  authLimiter,
};
