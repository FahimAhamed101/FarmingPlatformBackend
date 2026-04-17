const swaggerJSDoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Interactive Urban Farming Platform API",
      version: "1.0.0",
      description:
        "Node.js + Express + MongoDB backend for rental spaces, marketplace, sustainability verification, and plant tracking.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Request successful" },
            data: { type: "object" },
            meta: { type: "object" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                details: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
});

module.exports = swaggerSpec;
