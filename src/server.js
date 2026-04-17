const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const { setSocketServer } = require("./config/socket");

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: env.corsOrigin === "*" ? true : env.corsOrigin,
        methods: ["GET", "POST", "PATCH", "DELETE"],
      },
    });

    setSocketServer(io);

    io.on("connection", (socket) => {
      socket.on("join:plant", (plantId) => {
        socket.join(`plant:${plantId}`);
      });

      socket.on("leave:plant", (plantId) => {
        socket.leave(`plant:${plantId}`);
      });
    });

    server.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
