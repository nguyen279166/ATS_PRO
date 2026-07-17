import { PassThrough } from "stream";
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  generateCandidatesExcel,
  prepareRecruitmentPdf,
} from "./report.generators";

describe("report generators", () => {
  it("generates the candidates workbook with the current columns", () => {
    const candidates = [
      {
        name: "Nguyen Van A",
        email: "a@example.com",
        status: "Applied",
        appliedDate: new Date("2026-01-02T00:00:00.000Z"),
        job: { title: "Backend Engineer", department: "Engineering" },
      },
    ] as unknown as Parameters<typeof generateCandidatesExcel>[0];

    const buffer = generateCandidatesExcel(candidates);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets["Ứng viên"],
    );

    expect(workbook.SheetNames).toEqual(["Ứng viên"]);
    expect(rows).toEqual([
      expect.objectContaining({
        "Họ và tên": "Nguyen Van A",
        Email: "a@example.com",
        "Vị trí ứng tuyển": "Backend Engineer",
        "Phòng ban": "Engineering",
        "Trạng thái": "Applied",
        "Ngày ứng tuyển": expect.any(String),
      }),
    ]);
  });

  it("generates a readable PDF stream", async () => {
    const reportData = {
      jobs: [],
      candidates: [],
    } as unknown as Parameters<typeof prepareRecruitmentPdf>[0];
    const pdf = prepareRecruitmentPdf(reportData);
    const destination = new PassThrough();
    const chunks: Buffer[] = [];
    destination.on("data", (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<void>((resolve, reject) => {
      destination.on("finish", resolve);
      destination.on("error", reject);
    });

    pdf.pipe(destination);
    pdf.write();
    await finished;

    const buffer = Buffer.concat(chunks);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(1_000);
  });
});
