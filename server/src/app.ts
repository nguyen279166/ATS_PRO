import express from "express";
import cors from "cors";
import path from "path";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware, { requireAdmin } from "./routes/authMiddleware";
import publicRoutes from "./routes/publicRoutes";
import noteRoutes from "./routes/noteRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import exportRoutes from "./routes/exportRoutes";
import { getMailerHealth } from "./utils/mailer";
import { getRagHealth } from "./utils/rag";
import { ragHealthRateLimiter } from "./middleware/rateLimit";
import {
  ApiError,
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler";

const app = express();
const trustProxy = process.env.TRUST_PROXY?.trim();
if (trustProxy) {
  app.set(
    "trust proxy",
    /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy,
  );
}
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, "Nguồn yêu cầu không được phép"));
    },
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Route kiểm tra server
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", mail: getMailerHealth() });
});

// Gắn Route Job vào đường dẫn /api/jobs
app.get("/api/rag/health", ragHealthRateLimiter, async (req, res) => {
  res.status(200).json(await getRagHealth());
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", authMiddleware, jobRoutes);
app.use("/api/candidates", authMiddleware, candidateRoutes);
app.use("/api/notes", authMiddleware, noteRoutes);
app.use("/api/interviews", authMiddleware, interviewRoutes);
app.use("/api/export", authMiddleware, requireAdmin, exportRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
