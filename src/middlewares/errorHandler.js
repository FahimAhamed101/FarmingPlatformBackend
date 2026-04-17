const { StatusCodes, getReasonPhrase } = require("http-status-codes");

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  const payload = {
    success: false,
    message: err.message || getReasonPhrase(statusCode),
    error: {
      code: err.code || "INTERNAL_ERROR",
    },
  };

  if (err.details) {
    payload.error.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.error.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
