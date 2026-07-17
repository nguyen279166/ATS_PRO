import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  jobFindMany: vi.fn(),
  candidateFindMany: vi.fn(),
}));

vi.mock("../../prisma", () => ({
  default: {
    job: { findMany: mocks.jobFindMany },
    candidate: { findMany: mocks.candidateFindMany },
  },
}));

import {
  getRecruitmentReportData,
  listCandidatesForExcel,
} from "./report.service";

describe("report service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads candidates using the Excel export projection", async () => {
    mocks.candidateFindMany.mockResolvedValue([{ id: "candidate-1" }]);

    await expect(listCandidatesForExcel()).resolves.toEqual([
      { id: "candidate-1" },
    ]);
    expect(mocks.candidateFindMany).toHaveBeenCalledWith({
      include: { job: { select: { title: true, department: true } } },
      orderBy: { appliedDate: "desc" },
    });
  });

  it("loads jobs and candidates for the PDF report", async () => {
    const jobs = [{ id: "job-1" }];
    const candidates = [{ id: "candidate-1" }];
    mocks.jobFindMany.mockResolvedValue(jobs);
    mocks.candidateFindMany.mockResolvedValue(candidates);

    await expect(getRecruitmentReportData()).resolves.toEqual({
      jobs,
      candidates,
    });
    expect(mocks.jobFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(mocks.candidateFindMany).toHaveBeenCalledWith({
      include: { job: { select: { title: true } } },
      orderBy: { appliedDate: "desc" },
    });
  });
});
