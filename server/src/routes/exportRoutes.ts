import { Router } from "express";
import prisma from "../prisma";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import path from "path";

const FONT_REGULAR = path.join(__dirname, "../assets/fonts/Arial.ttf");
const FONT_BOLD    = path.join(__dirname, "../assets/fonts/Arial-Bold.ttf");

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/export/candidates.xlsx
// ─────────────────────────────────────────────────────────────
router.get("/candidates.xlsx", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: { job: { select: { title: true, department: true } } },
      orderBy: { appliedDate: "desc" },
    });

    const rows = candidates.map((c) => ({
      "Họ và tên": c.name,
      Email: c.email,
      "Vị trí ứng tuyển": c.job?.title ?? "",
      "Phòng ban": c.job?.department ?? "",
      "Trạng thái": c.status,
      "Ngày ứng tuyển": new Date(c.appliedDate).toLocaleDateString("vi-VN"),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Đặt độ rộng cột
    ws["!cols"] = [
      { wch: 25 }, // Họ tên
      { wch: 30 }, // Email
      { wch: 25 }, // Vị trí
      { wch: 18 }, // Phòng ban
      { wch: 15 }, // Trạng thái
      { wch: 18 }, // Ngày
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Ứng viên");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=candidates.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Lỗi export Excel:", error);
    res.status(500).json({ error: "Lỗi khi xuất Excel" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/export/report.pdf
// ─────────────────────────────────────────────────────────────
router.get("/report.pdf", async (req, res) => {
  try {
    const [jobs, candidates] = await Promise.all([
      prisma.job.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.candidate.findMany({ include: { job: { select: { title: true } } }, orderBy: { appliedDate: "desc" } }),
    ]);

    const total     = candidates.length;
    const hired     = candidates.filter((c) => c.status === "Hired").length;
    const rejected  = candidates.filter((c) => c.status === "Rejected").length;
    const interview = candidates.filter((c) => c.status === "Interviewing").length;
    const applied   = candidates.filter((c) => c.status === "Applied").length;
    const hireRate  = total > 0 ? Math.round((hired / total) * 100) : 0;

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold",    FONT_BOLD);

    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ── HEADER ──
    doc.font("Bold").fontSize(22).fillColor("#1e40af").text("ATSPRO – Báo cáo Tuyển dụng", { align: "center" });
    doc.moveDown(0.3);
    doc.font("Regular").fontSize(10).fillColor("#64748b").text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, { align: "center" });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(1);

    // ── THỐNG KÊ TỔNG QUAN ──
    doc.font("Bold").fontSize(14).fillColor("#0f172a").text("1. Tổng quan", { underline: true });
    doc.moveDown(0.5);

    const stats = [
      ["Tổng số tin tuyển dụng", jobs.length],
      ["Tổng số ứng viên", total],
      ["Đang chờ xử lý (Applied)", applied],
      ["Đang phỏng vấn", interview],
      ["Đã tuyển dụng (Hired)", hired],
      ["Đã từ chối (Rejected)", rejected],
      ["Tỷ lệ tuyển dụng", `${hireRate}%`],
    ];

    stats.forEach(([label, value]) => {
      doc.font("Regular").fontSize(11).fillColor("#374151");
      doc.text(`\u2022 ${label}: `, { continued: true }).font("Bold").fillColor("#1e40af").text(String(value));
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(1);

    // ── DANH SÁCH ỨNG VIÊN ──
    doc.font("Bold").fontSize(14).fillColor("#0f172a").text("2. Danh sách ứng viên gần đây (20 người mới nhất)", { underline: true });
    doc.moveDown(0.5);

    const recent = candidates.slice(0, 20);
    recent.forEach((c, i) => {
      const dateStr = new Date(c.appliedDate).toLocaleDateString("vi-VN");
      const statusColor = c.status === "Hired" ? "#065f46"
        : c.status === "Rejected" ? "#991b1b"
        : c.status === "Interviewing" ? "#1e40af"
        : "#374151";

      doc.font("Regular").fontSize(10).fillColor("#374151")
        .text(`${i + 1}. ${c.name}  |  ${c.email}  |  ${c.job?.title ?? ""}  |  `, { continued: true })
        .font("Bold").fillColor(statusColor).text(c.status, { continued: true })
        .font("Regular").fillColor("#94a3b8").text(`  (${dateStr})`);

      if (doc.y > 740) doc.addPage(); // Tránh tràn trang
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text("— Hết báo cáo —", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Lỗi export PDF:", error);
    res.status(500).json({ error: "Lỗi khi xuất PDF" });
  }
});

export default router;
