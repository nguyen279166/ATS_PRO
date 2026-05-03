import { Router } from "express";
import prisma from "../prisma";

const router = Router();

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
// POST /api/public/apply → Ứng viên nộp CV
// ========================
router.post("/apply", async (req, res) => {
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

    // Tạo Candidate mới
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        jobId,
        status: "Applied", // Mặc định vào cột đầu tiên
      },
    });

    res.status(201).json({ message: "Ứng tuyển thành công!", candidate });
  } catch (error) {
    console.error("Lỗi khi ứng tuyển:", error);
    res.status(500).json({ error: "Lỗi server khi nộp đơn" });
  }
});

export default router;
