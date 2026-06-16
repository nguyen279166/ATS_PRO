import dotenv from "dotenv";
dotenv.config(); // Load .env TRƯỚC KHI import routes

import express from "express";
import cors from "cors";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware, { requireAdmin } from "./routes/authMiddleware";
import publicRoutes from "./routes/publicRoutes";
import noteRoutes from "./routes/noteRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import exportRoutes from "./routes/exportRoutes";
import path from "path";
import { initMailer } from "./utils/mailer";

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
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

      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Route kiểm tra server
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "ATS Server đang chạy! 🚀" });
});

// Gắn Route Job vào đường dẫn /api/jobs
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", authMiddleware, jobRoutes);
app.use("/api/candidates", authMiddleware, candidateRoutes);
app.use("/api/notes", authMiddleware, noteRoutes);
app.use("/api/interviews", authMiddleware, interviewRoutes);
app.use("/api/export", authMiddleware, requireAdmin, exportRoutes);

app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  await initMailer(); // Khởi tạo dịch vụ gửi email
});
