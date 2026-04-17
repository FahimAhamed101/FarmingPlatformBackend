const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (user) =>
  jwt.sign(
    {
      sub: user._id,
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

module.exports = {
  generateToken,
};
