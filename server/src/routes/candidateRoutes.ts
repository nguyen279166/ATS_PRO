import { Router } from "express";
import prisma from "../prisma";
import { sendEmail } from "../utils/mailer";
import type { AuthRequest } from "./authMiddleware";
import { cvUpload, deleteCv, saveCv } from "../utils/cvStorage";
import { validateBody } from "../middleware/validate";
import {
  bulkCandidateSchema,
  candidateBodySchema,
  updateCandidateStatusSchema,
} from "../validation/schemas";

// ── Email template dùng chung ─────────────────────────────────
const buildEmailTemplate = (
  status: string,
  name: string,
  jobTitle: string,
  dept: string,
): { subject: string; html: string } | null => {
  const footer = `<br/><p style="color:#64748b;font-size:13px">Trân trọng,<br/><strong>Bộ phận Tuyển dụng – ATSPRO</strong></p>`;

  const templates: Record<string, { subject: string; html: string }> = {
    Interviewing: {
      subject: `📅 Thư mời phỏng vấn – ${jobTitle}`,
      html: `<h2 style="color:#1e40af">📅 Thư mời phỏng vấn</h2>
             <p>Chào <strong>${name}</strong>,</p>
             <p>Chúng tôi đã xem xét hồ sơ của bạn cho vị trí <strong>${jobTitle}</strong> tại phòng <strong>${dept}</strong> và rất vui mừng được mời bạn tham gia vòng phỏng vấn.</p>
             <p>Bộ phận nhân sự sẽ sớm liên hệ để sắp xếp lịch phỏng vấn cụ thể. Vui lòng chuẩn bị sẵn hồ sơ và các giấy tờ cần thiết.</p>
             ${footer}`,
    },
    Hired: {
      subject: `🎉 Chúc mừng! Bạn đã trúng tuyển vị trí ${jobTitle}`,
      html: `<h2 style="color:#065f46">🎉 Chúc mừng trúng tuyển!</h2>
             <p>Chào <strong>${name}</strong>,</p>
             <p>Chúng tôi rất vui mừng thông báo bạn đã chính thức <strong>trúng tuyển</strong> vị trí <strong>${jobTitle}</strong> tại phòng <strong>${dept}</strong>.</p>
             <p>Bộ phận nhân sự sẽ liên hệ với bạn trong thời gian sớm nhất để trao đổi về offer và lịch nhận việc.</p>
             ${footer}`,
    },
    Rejected: {
      subject: `Thư cảm ơn – Vị trí ${jobTitle}`,
      html: `<h2 style="color:#374151">Thư cảm ơn</h2>
             <p>Chào <strong>${name}</strong>,</p>
             <p>Cảm ơn bạn đã dành thời gian ứng tuyển vị trí <strong>${jobTitle}</strong> tại phòng <strong>${dept}</strong>.</p>
             <p>Sau quá trình xem xét kỹ lưỡng, chúng tôi đã tìm được ứng viên phù hợp hơn với nhu cầu hiện tại. Chúng tôi sẽ lưu hồ sơ của bạn và liên hệ khi có cơ hội phù hợp.</p>
             <p>Chúc bạn nhiều thành công!</p>
             ${footer}`,
    },
  };

  return templates[status] ?? null;
};

const router = Router();
router.get("/", async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(1000, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    // Advanced filters
    const status = req.query.status as string | undefined; // "Applied" | "Interviewing" | ...
    const jobId = req.query.jobId as string | undefined; // UUID của job
    const dateFrom = req.query.dateFrom as string | undefined; // "2024-01-01"
    const dateTo = req.query.dateTo as string | undefined; // "2024-12-31"

    // Build Prisma where clause động
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (dateFrom || dateTo) {
      where.appliedDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && {
          lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
        }),
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

router.post("/", validateBody(candidateBodySchema), async (req, res) => {
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

router.put("/:id", validateBody(updateCandidateStatusSchema), async (req, res) => {
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

    // Gửi email khi status thay đổi
    if (oldCandidate?.status !== status) {
      const tpl = buildEmailTemplate(
        status,
        updatedCandidate.name,
        updatedCandidate.job.title,
        updatedCandidate.job.department,
      );
      if (tpl) sendEmail(updatedCandidate.email, tpl.subject, tpl.html);
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
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate)
      return res.status(404).json({ error: "KhĂ´ng tĂ¬m tháº¥y á»©ng viĂªn" });

    await deleteCv(candidate.cvUrl, candidate.cvPublicId);
    await prisma.candidate.delete({ where: { id } });
    res.json({ message: "Xóa ứng viên thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa ứng viên:", error);
    res.status(500).json({ error: "Lỗi server khi xóa ứng viên" });
  }
});
// PATCH /api/candidates/bulk → Bulk update status hoặc bulk delete
router.patch("/bulk", validateBody(bulkCandidateSchema), async (req: AuthRequest, res) => {
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
        data: {
          status: status as "Applied" | "Interviewing" | "Hired" | "Rejected",
        },
      });

      // Gửi email cho từng ứng viên (fire-and-forget)
      if (
        status === "Interviewing" ||
        status === "Hired" ||
        status === "Rejected"
      ) {
        const affectedCandidates = await prisma.candidate.findMany({
          where: { id: { in: ids } },
          include: { job: true },
        });
        for (const c of affectedCandidates) {
          const tpl = buildEmailTemplate(
            status,
            c.name,
            c.job.title,
            c.job.department,
          );
          if (tpl) sendEmail(c.email, tpl.subject, tpl.html);
        }
      }

      return res.json({ message: `Đã cập nhật ${ids.length} ứng viên` });
    }

    if (action === "delete") {
      const candidatesToDelete = await prisma.candidate.findMany({
        where: { id: { in: ids } },
        select: { cvUrl: true, cvPublicId: true },
      });
      await Promise.all(
        candidatesToDelete.map((candidate) =>
          deleteCv(candidate.cvUrl, candidate.cvPublicId),
        ),
      );
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
router.post("/:id/cv", cvUpload.single("cv"), async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    if (!req.file)
      return res.status(400).json({ error: "Không có file được upload" });

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate)
      return res.status(404).json({ error: "Không tìm thấy ứng viên" });

    // Xóa file CV cũ nếu có
    await deleteCv(candidate.cvUrl, candidate.cvPublicId);
    const storedCv = await saveCv(req.file, candidate.name);
    const updated = await prisma.candidate.update({
      where: { id },
      data: storedCv,
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
    if (!candidate || !candidate.cvUrl)
      return res.status(404).json({ error: "Không có CV" });

    await deleteCv(candidate.cvUrl, candidate.cvPublicId);

    const updated = await prisma.candidate.update({
      where: { id },
      data: { cvUrl: null, cvPublicId: null, cvFileName: null },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Lỗi khi xóa CV" });
  }
});

export default router;
