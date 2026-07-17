import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import path from "path";
import type {
  getRecruitmentReportData,
  listCandidatesForExcel,
} from "./report.service";

const FONT_REGULAR = path.join(__dirname, "../../assets/fonts/Arial.ttf");
const FONT_BOLD = path.join(__dirname, "../../assets/fonts/Arial-Bold.ttf");

type ExcelCandidate = Awaited<
  ReturnType<typeof listCandidatesForExcel>
>[number];

type RecruitmentReportData = Awaited<
  ReturnType<typeof getRecruitmentReportData>
>;

export const generateCandidatesExcel = (candidates: ExcelCandidate[]) => {
  const rows = candidates.map((candidate) => ({
    "Họ và tên": candidate.name,
    Email: candidate.email,
    "Vị trí ứng tuyển": candidate.job?.title ?? "",
    "Phòng ban": candidate.job?.department ?? "",
    "Trạng thái": candidate.status,
    "Ngày ứng tuyển": new Date(candidate.appliedDate).toLocaleDateString(
      "vi-VN",
    ),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Ứng viên");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export type PreparedRecruitmentPdf = {
  pipe: (destination: NodeJS.WritableStream) => void;
  write: () => void;
};

export const prepareRecruitmentPdf = ({
  jobs,
  candidates,
}: RecruitmentReportData): PreparedRecruitmentPdf => {
  const total = candidates.length;
  const hired = candidates.filter((candidate) => candidate.status === "Hired").length;
  const rejected = candidates.filter(
    (candidate) => candidate.status === "Rejected",
  ).length;
  const interview = candidates.filter(
    (candidate) => candidate.status === "Interviewing",
  ).length;
  const applied = candidates.filter(
    (candidate) => candidate.status === "Applied",
  ).length;
  const hireRate = total > 0 ? Math.round((hired / total) * 100) : 0;

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.registerFont("Regular", FONT_REGULAR);
  doc.registerFont("Bold", FONT_BOLD);

  return {
    pipe(destination) {
      doc.pipe(destination);
    },
    write() {
      // ── HEADER ──
      doc
        .font("Bold")
        .fontSize(22)
        .fillColor("#1e40af")
        .text("ATSPRO – Báo cáo Tuyển dụng", { align: "center" });
      doc.moveDown(0.3);
      doc
        .font("Regular")
        .fontSize(10)
        .fillColor("#64748b")
        .text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, {
          align: "center",
        });
      doc.moveDown(1);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#e2e8f0")
        .stroke();
      doc.moveDown(1);

      // ── THỐNG KÊ TỔNG QUAN ──
      doc
        .font("Bold")
        .fontSize(14)
        .fillColor("#0f172a")
        .text("1. Tổng quan", { underline: true });
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
        doc
          .text(`\u2022 ${label}: `, { continued: true })
          .font("Bold")
          .fillColor("#1e40af")
          .text(String(value));
      });

      doc.moveDown(1);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#e2e8f0")
        .stroke();
      doc.moveDown(1);

      // ── DANH SÁCH ỨNG VIÊN ──
      doc
        .font("Bold")
        .fontSize(14)
        .fillColor("#0f172a")
        .text("2. Danh sách ứng viên gần đây (20 người mới nhất)", {
          underline: true,
        });
      doc.moveDown(0.5);

      const recent = candidates.slice(0, 20);
      recent.forEach((candidate, index) => {
        const dateStr = new Date(candidate.appliedDate).toLocaleDateString(
          "vi-VN",
        );
        const statusColor =
          candidate.status === "Hired"
            ? "#065f46"
            : candidate.status === "Rejected"
              ? "#991b1b"
              : candidate.status === "Interviewing"
                ? "#1e40af"
                : "#374151";

        doc
          .font("Regular")
          .fontSize(10)
          .fillColor("#374151")
          .text(
            `${index + 1}. ${candidate.name}  |  ${candidate.email}  |  ${candidate.job?.title ?? ""}  |  `,
            { continued: true },
          )
          .font("Bold")
          .fillColor(statusColor)
          .text(candidate.status, { continued: true })
          .font("Regular")
          .fillColor("#94a3b8")
          .text(`  (${dateStr})`);

        if (doc.y > 740) doc.addPage();
      });

      doc.moveDown(2);
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .text("— Hết báo cáo —", { align: "center" });

      doc.end();
    },
  };
};
