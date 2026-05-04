import { Router } from "express";
import prisma from "../prisma";
import { sendEmail } from "../utils/mailer";
import type { AuthRequest } from "./authMiddleware";

const router = Router();
router.get("/", async (_req: AuthRequest, res) => {
  try {
    // Tất cả người dùng đã đăng nhập đều thấy toàn bộ ứng viên
    const candidates = await prisma.candidate.findMany({
      include: {
        job: true,
      },
      orderBy: { appliedDate: "desc" },
    });
    res.json(candidates);
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

export default router;
