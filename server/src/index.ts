import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobRoutes from "./routes/jobRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware from "./routes/authMiddleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Route kiểm tra server
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "ATS Server đang chạy! 🚀" });
});

// Gắn Route Job vào đường dẫn /api/jobs
app.use("/api/auth", authRoutes);
app.use("/api/jobs", authMiddleware, jobRoutes);
app.use("/api/candidates", authMiddleware, candidateRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
