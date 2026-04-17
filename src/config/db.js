const mongoose = require("mongoose");
const env = require("./env");

const getMongoHelpText = (mongoUri) =>
  [
    `MongoDB connection failed for URI: ${mongoUri}`,
    "To fix this, do one of the following:",
    "1. Install and start MongoDB locally so it listens on 127.0.0.1:27017.",
    "2. Create a .env file and set MONGO_URI to a running MongoDB instance, such as MongoDB Atlas.",
    "3. If Atlas SRV lookups fail in Node.js, use the standard mongodb:// host list URI instead of mongodb+srv://.",
    "4. If you only want to run benchmark or app-load checks, use SKIP_DB=true for those scripts only.",
  ].join("\n");

const connectDB = async () => {
  if (process.env.SKIP_DB === "true") {
    return;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    error.message = `${error.message}\n\n${getMongoHelpText(env.mongoUri)}`;
    throw error;
  }
};

module.exports = connectDB;
