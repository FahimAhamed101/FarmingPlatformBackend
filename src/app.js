const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");
const xssClean = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const routes = require("./routes");
const swaggerSpec = require("./docs/swagger");
const { globalLimiter } = require("./middlewares/rateLimiters");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const { sendSuccess } = require("./utils/apiResponse");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin,
    credentials: true,
  })
);
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use("/api", globalLimiter);

app.get("/api/health", (_req, res) => {
  return sendSuccess(res, {
    message: "Urban farming backend is healthy.",
    data: {
      environment: env.nodeEnv,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
