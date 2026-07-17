import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  jobFindMany: vi.fn(),
  jobFindUnique: vi.fn(),
  candidateCreate: vi.fn(),
  saveCv: vi.fn(),
  indexCandidateCv: vi.fn(),
}));

vi.mock("../../prisma", () => ({
  default: {
    job: {
      findMany: mocks.jobFindMany,
      findUnique: mocks.jobFindUnique,
    },
    candidate: { create: mocks.candidateCreate },
  },
}));

vi.mock("../../utils/cvStorage", () => ({ saveCv: mocks.saveCv }));
vi.mock("../../utils/rag", () => ({
  indexCandidateCv: mocks.indexCandidateCv,
}));

import {
  createPublicApplication,
  indexPublicApplicationCv,
  listPublicJobs,
} from "./public.service";

const file = {
  originalname: "resume.pdf",
  buffer: Buffer.from("resume"),
} as Express.Multer.File;

describe("public service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists only open jobs using the existing public projection", async () => {
    mocks.jobFindMany.mockResolvedValue([{ id: "job-1" }]);

    await expect(listPublicJobs()).resolves.toEqual([{ id: "job-1" }]);
    expect(mocks.jobFindMany).toHaveBeenCalledWith({
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
  });

  it("stops before storage when the job is not open", async () => {
    mocks.jobFindUnique.mockResolvedValue({ id: "job-1", status: "Closed" });

    await expect(
      createPublicApplication({
        jobId: "job-1",
        name: "Nguyen Van A",
        email: "a@example.com",
        file,
      }),
    ).resolves.toBeNull();
    expect(mocks.saveCv).not.toHaveBeenCalled();
    expect(mocks.candidateCreate).not.toHaveBeenCalled();
  });

  it("checks the job, stores the CV, then creates the candidate", async () => {
    const order: string[] = [];
    const candidate = { id: "candidate-1", name: "Nguyen Van A" };
    mocks.jobFindUnique.mockImplementation(async () => {
      order.push("job");
      return { id: "job-1", status: "Open" };
    });
    mocks.saveCv.mockImplementation(async () => {
      order.push("storage");
      return {
        cvUrl: "/uploads/cv/resume.pdf",
        cvPublicId: null,
        cvFileName: "resume.pdf",
      };
    });
    mocks.candidateCreate.mockImplementation(async () => {
      order.push("candidate");
      return candidate;
    });

    await expect(
      createPublicApplication({
        jobId: "job-1",
        name: "Nguyen Van A",
        email: "a@example.com",
        file,
      }),
    ).resolves.toEqual(candidate);

    expect(order).toEqual(["job", "storage", "candidate"]);
    expect(mocks.saveCv).toHaveBeenCalledWith(file, "Nguyen Van A");
    expect(mocks.candidateCreate).toHaveBeenCalledWith({
      data: {
        name: "Nguyen Van A",
        email: "a@example.com",
        jobId: "job-1",
        status: "Applied",
        cvUrl: "/uploads/cv/resume.pdf",
        cvPublicId: null,
        cvFileName: "resume.pdf",
      },
    });
  });

  it("delegates background CV indexing", async () => {
    mocks.indexCandidateCv.mockResolvedValue({ indexed: true });

    await indexPublicApplicationCv("candidate-1", file);

    expect(mocks.indexCandidateCv).toHaveBeenCalledWith("candidate-1", file);
  });
});
