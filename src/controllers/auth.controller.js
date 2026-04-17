const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const VendorProfile = require("../models/VendorProfile");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { generateToken } = require("../utils/token");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer", farmName, farmLocation, latitude, longitude } = req.body;

  if (role === "admin") {
    const error = new Error("Public registration as admin is not allowed.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN_ROLE";
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email is already in use.");
    error.statusCode = StatusCodes.CONFLICT;
    error.code = "EMAIL_EXISTS";
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    status: role === "vendor" ? "pending" : "active",
  });

  if (role === "vendor") {
    const vendorProfilePayload = {
      userId: user._id,
      farmName: farmName || `${name}'s Urban Farm`,
      farmLocation: farmLocation || "Location pending",
      certificationStatus: "pending",
    };

    if (typeof latitude === "number" && typeof longitude === "number") {
      vendorProfilePayload.farmGeo = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    await VendorProfile.create(vendorProfilePayload);
  }

  const token = generateToken(user);

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: role === "vendor" ? "Vendor registered and pending admin approval." : "Registration successful.",
    data: {
      user,
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = StatusCodes.UNAUTHORIZED;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = StatusCodes.UNAUTHORIZED;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  if (user.status === "suspended" || user.status === "inactive") {
    const error = new Error("Account is inactive.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "ACCOUNT_INACTIVE";
    throw error;
  }

  const token = generateToken(user);

  return sendSuccess(res, {
    message: "Login successful.",
    data: {
      user,
      token,
    },
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "User profile fetched successfully.",
    data: req.user,
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
