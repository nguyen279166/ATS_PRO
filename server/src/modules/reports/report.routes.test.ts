import express, { type Response } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reportMocks = vi.hoisted(() => ({
  listCandidatesForExcel: vi.fn(),
  getRecruitmentReportData: vi.fn(),
  generateCandidatesExcel: vi.fn(),
  prepareRecruitmentPdf: vi.fn(),
}));

vi.mock("./report.service", () => ({
  listCandidatesForExcel: reportMocks.listCandidatesForExcel,
  getRecruitmentReportData: reportMocks.getRecruitmentReportData,
}));

vi.mock("./report.generators", () => ({
  generateCandidatesExcel: reportMocks.generateCandidatesExcel,
  prepareRecruitmentPdf: reportMocks.prepareRecruitmentPdf,
}));

import exportRoutes from "../../routes/exportRoutes";

const app = express();
app.use(exportRoutes);

describe("report route contracts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("serves the candidates workbook with the existing headers", async () => {
    const candidates = [{ id: "candidate-1" }];
    reportMocks.listCandidatesForExcel.mockResolvedValue(candidates);
    reportMocks.generateCandidatesExcel.mockReturnValue(Buffer.from("xlsx"));

    const response = await request(app).get("/candidates.xlsx");

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toBe(
      "attachment; filename=candidates.xlsx",
    );
    expect(response.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(reportMocks.generateCandidatesExcel).toHaveBeenCalledWith(
      candidates,
    );
  });

  it("serves the recruitment PDF with the existing headers", async () => {
    const reportData = { jobs: [], candidates: [] };
    reportMocks.getRecruitmentReportData.mockResolvedValue(reportData);
    reportMocks.prepareRecruitmentPdf.mockImplementation(() => {
      let destination: Response | undefined;
      return {
        pipe(response: Response) {
          destination = response;
        },
        write() {
          destination?.end(Buffer.from("%PDF-test"));
        },
      };
    });

    const response = await request(app).get("/report.pdf");

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toBe(
      "attachment; filename=report.pdf",
    );
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(reportMocks.prepareRecruitmentPdf).toHaveBeenCalledWith(reportData);
  });

  it("keeps the Excel error response contract", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    reportMocks.listCandidatesForExcel.mockRejectedValue(new Error("database"));

    const response = await request(app).get("/candidates.xlsx");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Lỗi khi xuất Excel" });
    expect(consoleError).toHaveBeenCalledWith(
      "Lỗi export Excel:",
      expect.any(Error),
    );
  });
});
