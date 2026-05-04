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
    const { title, department, location, description } = req.body;
    // Lấy userId từ token (đã được authMiddleware gắn vào req.user)
    const userId = (req as any).user.userId;
    
    const job = await prisma.job.create({
      data: { title, department, location, description, userId },
    });
    res.status(201).json(job);
  } catch (error) {
    console.error("Lỗi khi tạo Job:", error);
    res.status(500).json({ error: "Lỗi server khi tạo Job" });
  }
});

// PUT /api/jobs/:id → Cập nhật Job
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, description } = req.body;
    // Lấy userId từ token để verify quyền (nếu cần, tạm thời cứ update)
    // const userId = (req as any).user.userId;
    
    const job = await prisma.job.update({
      where: { id },
      data: { title, department, location, description },
    });
    res.json(job);
  } catch (error) {
    console.error("Lỗi khi cập nhật Job:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật Job" });
  }
});

export default router;
