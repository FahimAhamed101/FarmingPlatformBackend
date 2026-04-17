const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const defaultMongoUri = "mongodb://127.0.0.1:27017/urban_farming";
const mongoUri = process.env.MONGO_URI || defaultMongoUri;

const getDatabaseName = (connectionString) => {
  const normalized = connectionString.split("?")[0].replace(/\/+$/, "");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || "urban_farming";
};

module.exports = {
  mongodb: {
    url: mongoUri,
    databaseName: getDatabaseName(mongoUri),
    options: {},
  },
  migrationsDir: "migrations",
  changelogCollectionName: process.env.MIGRATE_MONGO_COLLECTION || "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
};
