import dotenv from "dotenv";
dotenv.config(); // Load .env TRƯỚC KHI import routes

import express from "express";
import cors from "cors";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware from "./routes/authMiddleware";
import publicRoutes from "./routes/publicRoutes";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
