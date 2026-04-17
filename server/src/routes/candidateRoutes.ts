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
    const { name, email, jobId } = req.body;
    const candidate = await prisma.candidate.create({
      data: { name, email, jobId },
    });
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi tạo ứng viên" });
  }
});

export default router;
