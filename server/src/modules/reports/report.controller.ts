import type { Request, Response } from "express";
import {
  generateCandidatesExcel,
  prepareRecruitmentPdf,
} from "./report.generators";
import {
  getRecruitmentReportData,
  listCandidatesForExcel,
} from "./report.service";

export const exportCandidatesExcel = async (_req: Request, res: Response) => {
  try {
    const candidates = await listCandidatesForExcel();
    const buffer = generateCandidatesExcel(candidates);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=candidates.xlsx",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Lỗi export Excel:", error);
    res.status(500).json({ error: "Lỗi khi xuất Excel" });
  }
};

export const exportRecruitmentPdf = async (_req: Request, res: Response) => {
  try {
    const reportData = await getRecruitmentReportData();
    const pdf = prepareRecruitmentPdf(reportData);

    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    pdf.pipe(res);
    pdf.write();
  } catch (error) {
    console.error("Lỗi export PDF:", error);
    res.status(500).json({ error: "Lỗi khi xuất PDF" });
  }
};
