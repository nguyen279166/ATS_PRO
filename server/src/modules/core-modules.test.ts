import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  job: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  note: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  interview: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../prisma", () => ({ default: prismaMock }));

import { listJobs } from "./jobs/job.service";
import {
  NoteForbiddenError,
  NoteNotFoundError,
  updateNote,
} from "./notes/note.service";
import {
  createInterview,
  InterviewNotFoundError,
  updateInterview,
} from "./interviews/interview.service";

describe("backend module service contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the jobs list include and ordering contract", async () => {
    prismaMock.job.findMany.mockResolvedValue([{ id: "job-1" }]);

    await expect(listJobs()).resolves.toEqual([{ id: "job-1" }]);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  it("keeps note not-found and ownership checks in the service", async () => {
    prismaMock.note.findUnique.mockResolvedValueOnce(null);
    await expect(updateNote("missing", "Nội dung", "user-1")).rejects.toBeInstanceOf(
      NoteNotFoundError,
    );

    prismaMock.note.findUnique.mockResolvedValueOnce({ userId: "user-2" });
    await expect(updateNote("note-1", "Nội dung", "user-1")).rejects.toBeInstanceOf(
      NoteForbiddenError,
    );
    expect(prismaMock.note.update).not.toHaveBeenCalled();
  });

  it("normalizes optional interview fields without changing the API contract", async () => {
    prismaMock.interview.create.mockResolvedValue({ id: "interview-1" });

    await createInterview(
      {
        candidateId: "candidate-1",
        scheduledAt: "2026-07-18T09:00:00.000Z",
        location: "   ",
        notes: "   ",
      },
      "user-1",
    );

    expect(prismaMock.interview.create).toHaveBeenCalledWith({
      data: {
        candidateId: "candidate-1",
        scheduledAt: new Date("2026-07-18T09:00:00.000Z"),
        location: null,
        notes: null,
        createdBy: "user-1",
      },
      include: {
        creator: { select: { fullName: true, avatar: true } },
      },
    });
  });

  it("does not update an interview that no longer exists", async () => {
    prismaMock.interview.findUnique.mockResolvedValue(null);

    await expect(
      updateInterview("missing", { status: "Completed" }),
    ).rejects.toBeInstanceOf(InterviewNotFoundError);
    expect(prismaMock.interview.update).not.toHaveBeenCalled();
  });
});
