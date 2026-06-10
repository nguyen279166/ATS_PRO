import { Router } from "express";
import prisma from "../prisma";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Multer config cho public apply (không cần auth)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../../uploads/cv");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cv_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG"));
  },
});

// ========================
// GET /api/public/jobs → Lấy danh sách công việc đang tuyển dụng
// ========================
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "Open" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        description: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách job public:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ========================
// POST /api/public/apply → Ứng viên nộp CV (có thể kèm file)
// ========================
router.post("/apply", upload.single("cv"), async (req, res) => {
  try {
    const { jobId, name, email } = req.body;

    if (!jobId || !name || !email) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra xem Job có tồn tại và đang Open không
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "Open") {
      return res.status(400).json({ error: "Công việc này không còn nhận ứng viên" });
    }

    // Lưu đường dẫn CV nếu có upload
    const cvUrl = req.file ? `/uploads/cv/${req.file.filename}` : null;

    // Tạo Candidate mới
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        jobId,
        status: "Applied",
        ...(cvUrl && { cvUrl }),
      },
    });

    res.status(201).json({ message: "Ứng tuyển thành công!", candidate });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server khi nộp đơn";
    console.error("Lỗi khi ứng tuyển:", error);
    res.status(500).json({ error: msg });
  }
});

export default router;
