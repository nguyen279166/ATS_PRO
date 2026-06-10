import { Router } from "express";
import prisma from "../prisma";
import { sendEmail } from "../utils/mailer";
import type { AuthRequest } from "./authMiddleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer config: lưu file vào /uploads/cv, giữ tên gốc + timestamp
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../../uploads/cv");
    fs.mkdirSync(dir, { recursive: true }); // tạo thư mục nếu chưa có
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cv_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file PDF, DOC, DOCX, JPG, PNG"));
  },
});

const router = Router();
router.get("/", async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(1000, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    // Advanced filters
    const status = req.query.status as string | undefined;   // "Applied" | "Interviewing" | ...
    const jobId  = req.query.jobId  as string | undefined;   // UUID của job
    const dateFrom = req.query.dateFrom as string | undefined; // "2024-01-01"
    const dateTo   = req.query.dateTo   as string | undefined; // "2024-12-31"

    // Build Prisma where clause động
    const where: Record<string, unknown> = {};
    if (status)   where.status = status;
    if (jobId)    where.jobId  = jobId;
    if (dateFrom || dateTo) {
      where.appliedDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo   && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
      };
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: { job: true },
        orderBy: { appliedDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.candidate.count({ where }), // count cũng filter để totalPages đúng
    ]);

    res.json({
      data: candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
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
  } catch {
    res.status(500).json({ error: "Lỗi server khi tạo ứng viên" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    // Tìm candidate cũ để biết nó có thực sự thay đổi trạng thái không
    const oldCandidate = await prisma.candidate.findUnique({ where: { id } });

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { status },
      include: { job: true }, // Lấy kèm thông tin công việc để gửi email
    });

    // Chỉ gửi email nếu chuyển sang Hired hoặc Rejected và trạng thái thực sự thay đổi
    if (oldCandidate?.status !== status && (status === "Hired" || status === "Rejected")) {
      const subject = status === "Hired" 
        ? `🎉 Chúc mừng! Bạn đã trúng tuyển vị trí ${updatedCandidate.job.title}`
        : `Thư cảm ơn từ công ty về vị trí ${updatedCandidate.job.title}`;
        
      const html = status === "Hired"
        ? `<h3>Chào ${updatedCandidate.name},</h3>
           <p>Chúng tôi rất vui mừng thông báo bạn đã trúng tuyển vị trí <strong>${updatedCandidate.job.title}</strong> tại phòng ${updatedCandidate.job.department}.</p>
           <p>Bộ phận nhân sự sẽ sớm liên hệ với bạn để trao đổi về offer và lịch nhận việc.</p>
           <br/><p>Trân trọng,<br/>Đội ngũ Tuyển dụng</p>`
        : `<h3>Chào ${updatedCandidate.name},</h3>
           <p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <strong>${updatedCandidate.job.title}</strong>.</p>
           <p>Mặc dù hồ sơ của bạn rất ấn tượng, nhưng hiện tại chúng tôi đã tìm được ứng viên phù hợp hơn với nhu cầu hiện tại. Chúng tôi sẽ lưu hồ sơ của bạn cho các đợt tuyển dụng sau.</p>
           <br/><p>Chúc bạn nhiều thành công trên con đường sự nghiệp,<br/>Đội ngũ Tuyển dụng</p>`;
           
      // Không await để request API không bị chậm
      sendEmail(updatedCandidate.email, subject, html);
    }

    res.json(updatedCandidate);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái ứng viên:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật ứng viên" });
  }
});

// DELETE /api/candidates/:id → Xóa Candidate
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await prisma.candidate.delete({ where: { id } });
    res.json({ message: "Xóa ứng viên thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa ứng viên:", error);
    res.status(500).json({ error: "Lỗi server khi xóa ứng viên" });
  }
});
// PATCH /api/candidates/bulk → Bulk update status hoặc bulk delete
router.patch("/bulk", async (req: AuthRequest, res) => {
  try {
    const { ids, action, status } = req.body as {
      ids: string[];
      action: "updateStatus" | "delete";
      status?: string;
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Cần truyền danh sách ids" });
    }

    if (action === "updateStatus") {
      if (!status) return res.status(400).json({ error: "Cần truyền status" });
      await prisma.candidate.updateMany({
        where: { id: { in: ids } },
        data: { status: status as "Applied" | "Interviewing" | "Hired" | "Rejected" },
      });
      return res.json({ message: `Đã cập nhật ${ids.length} ứng viên` });
    }

    if (action === "delete") {
      await prisma.candidate.deleteMany({ where: { id: { in: ids } } });
      return res.json({ message: `Đã xóa ${ids.length} ứng viên` });
    }

    res.status(400).json({ error: "action không hợp lệ" });
  } catch (error) {
    console.error("Lỗi bulk action:", error);
    res.status(500).json({ error: "Lỗi server khi thực hiện bulk action" });
  }
});
// POST /api/candidates/:id/cv → Upload CV
router.post("/:id/cv", upload.single("cv"), async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    if (!req.file) return res.status(400).json({ error: "Không có file được upload" });

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return res.status(404).json({ error: "Không tìm thấy ứng viên" });

    // Xóa file CV cũ nếu có
    if (candidate.cvUrl) {
      const oldPath = path.join(__dirname, "../../", candidate.cvUrl.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const cvUrl = `/uploads/cv/${req.file.filename}`;
    const updated = await prisma.candidate.update({
      where: { id },
      data: { cvUrl },
    });
    res.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi server";
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/candidates/:id/cv → Xóa CV
router.delete("/:id/cv", async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate || !candidate.cvUrl) return res.status(404).json({ error: "Không có CV" });

    const filePath = path.join(__dirname, "../../", candidate.cvUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const updated = await prisma.candidate.update({
      where: { id },
      data: { cvUrl: null },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Lỗi khi xóa CV" });
  }
});

export default router;
