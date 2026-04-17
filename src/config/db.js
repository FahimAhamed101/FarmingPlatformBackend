const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  if (process.env.SKIP_DB === "true") {
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
};

module.exports = connectDB;
