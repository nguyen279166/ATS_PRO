import { Router } from "express";
import prisma from "../prisma";
import type { AuthRequest } from "./authMiddleware";
import { Response } from "express";

const router = Router();

// GET /api/interviews/:candidateId → Lấy tất cả lịch PV của 1 ứng viên
router.get("/:candidateId", async (req: AuthRequest, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
    const interviews = await prisma.interview.findMany({
      where: { candidateId },
      include: {
        creator: { select: { fullName: true, avatar: true } },
      },
      orderBy: { scheduledAt: "asc" }, // Sắp xếp theo thời gian tăng dần
    });
    res.json(interviews);
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy lịch phỏng vấn" });
  }
});

// POST /api/interviews → Tạo lịch phỏng vấn mới
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, scheduledAt, location, notes } = req.body;
    const createdBy = req.user?.userId as string;

    if (!createdBy) {
      return res.status(401).json({ error: "Không xác định được người dùng" });
    }
    if (!candidateId || !scheduledAt) {
      return res.status(400).json({ error: "candidateId và scheduledAt là bắt buộc" });
    }

    const interview = await prisma.interview.create({
      data: {
        candidateId,
        scheduledAt: new Date(scheduledAt),
        location: location?.trim() || null,
        notes: notes?.trim() || null,
        createdBy,
      },
      include: {
        creator: { select: { fullName: true, avatar: true } },
      },
    });
    res.status(201).json(interview);
  } catch {
    res.status(500).json({ error: "Lỗi server khi tạo lịch phỏng vấn" });
  }
});

// PUT /api/interviews/:id → Cập nhật trạng thái hoặc thông tin
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { scheduledAt, location, notes, status } = req.body;

    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy lịch phỏng vấn" });
    }

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(status && { status }),
      },
      include: {
        creator: { select: { fullName: true, avatar: true } },
      },
    });
    res.json(interview);
  } catch {
    res.status(500).json({ error: "Lỗi server khi cập nhật lịch phỏng vấn" });
  }
});

// DELETE /api/interviews/:id → Xóa lịch phỏng vấn
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy lịch phỏng vấn" });
    }

    await prisma.interview.delete({ where: { id } });
    res.json({ message: "Xóa lịch phỏng vấn thành công" });
  } catch {
    res.status(500).json({ error: "Lỗi server khi xóa lịch phỏng vấn" });
  }
});

export default router;
