import { Router } from "express";
import prisma from "../prisma";
import type { AuthRequest } from "./authMiddleware";
import { requireAdmin } from "./authMiddleware";

const router = Router();

// GET /api/jobs → Lấy TẤT CẢ danh sách Job (kèm số ứng viên)
router.get("/", async (_req: AuthRequest, res) => {
  try {
    // Tất cả người dùng đã đăng nhập đều thấy toàn bộ Job
    // (Phân quyền chỉ áp dụng khi Tạo/Sửa/Xóa)
    const jobs = await prisma.job.findMany({
      include: {
        _count: { select: { candidates: true } }, // Đếm số ứng viên mỗi Job
      },
      orderBy: { createdAt: "desc" }, // Mới nhất lên đầu
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy danh sách Job" });
  }
});

// POST /api/jobs → Tạo Job mới
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { title, department, location, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Không xác định được người dùng" });
      return;
    }

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
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { title, department, location, description } = req.body;

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

// DELETE /api/jobs/:id → Xóa Job (chỉ Admin)
router.delete("/:id", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await prisma.job.delete({ where: { id } });
    res.json({ message: "Xóa Job thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa Job:", error);
    res.status(500).json({ error: "Lỗi server khi xóa Job" });
  }
});

export default router;
