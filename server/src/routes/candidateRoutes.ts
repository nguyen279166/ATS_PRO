import { Router } from "express";
import prisma from "../prisma";

const router = Router();
router.get("/", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        job: true,
      },
      orderBy: { appliedDate: "desc" },
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy danh sách ứng viên" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, jobId, status } = req.body;
    const candidate = await prisma.candidate.create({
      data: { name, email, jobId, status: status || "Applied" },
    });
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi tạo ứng viên" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { status },
    });
    res.json(updatedCandidate);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái ứng viên:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật ứng viên" });
  }
});

export default router;
