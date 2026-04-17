const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const env = require("../config/env");

const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      const error = new Error("Authentication token is required.");
      error.statusCode = StatusCodes.UNAUTHORIZED;
      error.code = "AUTH_REQUIRED";
      throw error;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      const error = new Error("Invalid authentication token.");
      error.statusCode = StatusCodes.UNAUTHORIZED;
      error.code = "INVALID_TOKEN";
      throw error;
    }

    if (user.status === "suspended" || user.status === "inactive") {
      const error = new Error("User account is inactive.");
      error.statusCode = StatusCodes.FORBIDDEN;
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    req.user = user;
    return next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = StatusCodes.UNAUTHORIZED;
      err.message = "Invalid or expired token.";
      err.code = "INVALID_TOKEN";
    }

    return next(err);
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error("You are not allowed to perform this action.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    return next(error);
  }

  return next();
};

module.exports = {
  protect,
  authorize,
};
