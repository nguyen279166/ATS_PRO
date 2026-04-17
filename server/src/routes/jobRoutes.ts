import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// GET /api/jobs → Lấy TẤT CẢ danh sách Job (kèm số ứng viên)
router.get("/", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        _count: { select: { candidates: true } }, // Đếm số ứng viên mỗi Job
      },
      orderBy: { createdAt: "desc" }, // Mới nhất lên đầu
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy danh sách Job" });
  }
});

// POST /api/jobs → Tạo Job mới
router.post("/", async (req, res) => {
  try {
    const { title, department, location, userId } = req.body;
    const job = await prisma.job.create({
      data: { title, department, location, userId },
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi tạo Job" });
  }
});

export default router;
