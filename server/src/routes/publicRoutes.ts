import { Router } from "express";
import prisma from "../prisma";
import { cvUpload, saveCv } from "../utils/cvStorage";

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
router.post("/apply", cvUpload.single("cv"), async (req, res) => {
  try {
    const { jobId, name, email } = req.body;

    if (!jobId || !name || !email) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Kiểm tra xem Job có tồn tại và đang Open không
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "Open") {
      return res
        .status(400)
        .json({ error: "Công việc này không còn nhận ứng viên" });
    }

    // Lưu đường dẫn CV nếu có upload
    const storedCv = req.file ? await saveCv(req.file) : null;

    // Tạo Candidate mới
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        jobId,
        status: "Applied",
        ...(storedCv && storedCv),
      },
    });

    res.status(201).json({ message: "Ứng tuyển thành công!", candidate });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Lỗi server khi nộp đơn";
    console.error("Lỗi khi ứng tuyển:", error);
    res.status(500).json({ error: msg });
  }
});

export default router;
