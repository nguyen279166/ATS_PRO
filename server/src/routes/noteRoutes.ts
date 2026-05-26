import { Router } from "express";
import prisma from "../prisma";
import type { AuthRequest } from "./authMiddleware";
import { Response } from "express";

const router = Router();

// GET /api/notes/:candidateId → Lấy tất cả notes của 1 ứng viên
router.get("/:candidateId", async (req: AuthRequest, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
    const notes = await prisma.note.findMany({
      where: { candidateId },
      include: {
        user: { select: { fullName: true, avatar: true } }, // Ai viết note
      },
      orderBy: { createdAt: "desc" }, // Mới nhất lên đầu
    });
    res.json(notes);
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy ghi chú" });
  }
});

// POST /api/notes → Tạo note mới
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Không xác định được người dùng" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ error: "Nội dung ghi chú không được trống" });
    }

    const note = await prisma.note.create({
      data: { content, candidateId, userId },
      include: {
        user: { select: { fullName: true, avatar: true } },
      },
    });
    res.status(201).json(note);
  } catch {
    res.status(500).json({ error: "Lỗi server khi tạo ghi chú" });
  }
});

// PUT /api/notes/:id → Sửa note
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { content } = req.body;
    const userId = req.user?.userId as string;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Nội dung ghi chú không được trống" });
    }

    // Kiểm tra note có tồn tại và thuộc về user này không
    const existingNote = await prisma.note.findUnique({ where: { id } });
    if (!existingNote) {
      return res.status(404).json({ error: "Không tìm thấy ghi chú" });
    }
    if (existingNote.userId !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền sửa ghi chú này" });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { fullName: true, avatar: true } },
      },
    });
    res.json(note);
  } catch {
    res.status(500).json({ error: "Lỗi server khi sửa ghi chú" });
  }
});

// DELETE /api/notes/:id → Xóa note
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId as string;

    const existingNote = await prisma.note.findUnique({ where: { id } });
    if (!existingNote) {
      return res.status(404).json({ error: "Không tìm thấy ghi chú" });
    }
    if (existingNote.userId !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền xóa ghi chú này" });
    }

    await prisma.note.delete({ where: { id } });
    res.json({ message: "Xóa ghi chú thành công" });
  } catch {
    res.status(500).json({ error: "Lỗi server khi xóa ghi chú" });
  }
});

export default router;
