import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./src/common/config/db.js";
import { registerApiRoutes } from "./src/routes/index.js";
import errorHandler from "./src/common/middlewares/error.middleware.js";
import { setupSwagger } from "./docs/swagger/setup.js";
import logger from "./src/common/helpers/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

setupSwagger(app);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

registerApiRoutes(app);

app.use(errorHandler);

app.listen(PORT, (err) => {
  if (err) {
    logger.error(err);
    return;
  }
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
  logger.info("Storage: s3");
});
