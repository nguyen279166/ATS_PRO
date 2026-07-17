import { describe, expect, it, vi } from "vitest";
import {
  createCandidateService,
  type CandidateServiceDependencies,
} from "./candidate.service";

const candidateRecord = {
  id: "candidate-1",
  name: "Nguyen Van A",
  email: "candidate@example.com",
  status: "Applied",
  appliedDate: new Date("2026-07-01T00:00:00.000Z"),
  avatar: null,
  cvUrl: "/uploads/cv/old.pdf",
  cvPublicId: null,
  cvFileName: "old.pdf",
  cvExtractedText: null,
  cvExtractedAt: null,
  cvExtractionProvider: null,
  jobId: "job-1",
};

const jobRecord = {
  id: "job-1",
  title: "Backend Engineer",
  department: "Engineering",
  location: "Ho Chi Minh City",
  description: "",
  status: "Open",
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  userId: "user-1",
};

const createTestContext = () => {
  const candidate = {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  };
  const mocks = {
    sendEmail: vi.fn(),
    deleteCv: vi.fn(),
    saveCv: vi.fn(),
    indexCandidateCv: vi.fn(),
    reindexCandidateCvFromUrl: vi.fn(),
    deleteCandidateCvIndex: vi.fn(),
    askCandidateCv: vi.fn(),
    getRagErrorMessage: vi.fn(() => "rag error"),
  };

  const dependencies = {
    candidate,
    ...mocks,
  } as unknown as CandidateServiceDependencies;

  return {
    service: createCandidateService(dependencies),
    candidate,
    mocks,
  };
};

describe("candidate service contracts", () => {
  it("keeps list filters and pagination in both candidate queries", async () => {
    const { service, candidate } = createTestContext();
    candidate.findMany.mockResolvedValue([candidateRecord]);
    candidate.count.mockResolvedValue(21);

    const result = await service.listCandidates({
      page: "2",
      limit: "10",
      status: "Applied",
      jobId: "job-1",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-15",
    });

    expect(result).toEqual({
      data: [candidateRecord],
      pagination: {
        total: 21,
        page: 2,
        limit: 10,
        totalPages: 3,
      },
    });

    expect(candidate.findMany).toHaveBeenCalledWith({
      where: {
        status: "Applied",
        jobId: "job-1",
        appliedDate: {
          gte: new Date("2026-07-01"),
          lte: expect.any(Date),
        },
      },
      include: { job: true },
      orderBy: { appliedDate: "desc" },
      skip: 10,
      take: 10,
    });
    expect(candidate.count).toHaveBeenCalledWith({
      where: candidate.findMany.mock.calls[0][0].where,
    });
  });

  it("returns the existing status notification shape after sending email", async () => {
    const { service, candidate, mocks } = createTestContext();
    const updatedCandidate = {
      ...candidateRecord,
      status: "Interviewing",
      job: jobRecord,
    };
    candidate.findUnique.mockResolvedValue(candidateRecord);
    candidate.update.mockResolvedValue(updatedCandidate);
    mocks.sendEmail.mockResolvedValue({ sent: true });

    const result = await service.updateCandidateStatus(
      candidateRecord.id,
      "Interviewing",
    );

    expect(result).toEqual({
      candidate: updatedCandidate,
      notification: {
        attempted: true,
        delivery: { sent: true },
      },
    });
    expect(candidate.update).toHaveBeenCalledWith({
      where: { id: candidateRecord.id },
      data: { status: "Interviewing" },
      include: { job: true },
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      candidateRecord.email,
      "📅 Thư mời phỏng vấn – Backend Engineer",
      expect.stringContaining("Nguyen Van A"),
    );
    expect(candidate.findUnique.mock.invocationCallOrder[0]).toBeLessThan(
      candidate.update.mock.invocationCallOrder[0],
    );
    expect(candidate.update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.sendEmail.mock.invocationCallOrder[0],
    );
  });

  it("keeps bulk status response counts and sequential notifications", async () => {
    const { service, candidate, mocks } = createTestContext();
    const candidates = [
      { ...candidateRecord, job: jobRecord },
      {
        ...candidateRecord,
        id: "candidate-2",
        name: "Tran Thi B",
        email: "second@example.com",
        job: jobRecord,
      },
    ];
    candidate.findMany.mockResolvedValue(candidates);
    candidate.updateMany.mockResolvedValue({ count: 2 });
    mocks.sendEmail
      .mockResolvedValueOnce({ sent: true })
      .mockResolvedValueOnce({ sent: false, reason: "send_failed" });

    const result = await service.bulkCandidates({
      ids: ["candidate-1", "candidate-2"],
      action: "updateStatus",
      status: "Hired",
    });

    expect(result).toEqual({
      kind: "success",
      body: {
        message: "Đã cập nhật 2 ứng viên",
        notification: {
          attempted: 2,
          sent: 1,
          failed: 1,
        },
      },
    });
    expect(candidate.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["candidate-1", "candidate-2"] },
        status: { not: "Hired" },
      },
      include: { job: true },
    });
    expect(candidate.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["candidate-1", "candidate-2"] } },
      data: { status: "Hired" },
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(candidate.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.sendEmail.mock.invocationCallOrder[0],
    );
    expect(mocks.sendEmail.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.sendEmail.mock.invocationCallOrder[1],
    );
  });

  it("keeps CV replacement, database update, and RAG indexing order", async () => {
    const { service, candidate, mocks } = createTestContext();
    const file = {
      fieldname: "cv",
      originalname: "resume.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: 3,
      buffer: Buffer.from("cv"),
    } as Express.Multer.File;
    const storedCv = {
      cvUrl: "/uploads/cv/new.pdf",
      cvPublicId: null,
      cvFileName: "resume.pdf",
    };
    const updatedCandidate = {
      ...candidateRecord,
      ...storedCv,
    };

    candidate.findUnique.mockResolvedValue(candidateRecord);
    mocks.deleteCv.mockResolvedValue(undefined);
    mocks.saveCv.mockResolvedValue(storedCv);
    candidate.update.mockResolvedValue(updatedCandidate);
    mocks.indexCandidateCv.mockResolvedValue({
      indexed: true,
      chunkCount: 3,
    });

    const result = await service.uploadCandidateCv(
      candidateRecord.id,
      file,
    );

    expect(result).toEqual({
      ...updatedCandidate,
      cvIndex: {
        indexed: true,
        chunkCount: 3,
      },
    });
    expect(mocks.deleteCv).toHaveBeenCalledWith(
      candidateRecord.cvUrl,
      candidateRecord.cvPublicId,
    );
    expect(mocks.saveCv).toHaveBeenCalledWith(file, candidateRecord.name);
    expect(candidate.update).toHaveBeenCalledWith({
      where: { id: candidateRecord.id },
      data: storedCv,
    });
    expect(mocks.indexCandidateCv).toHaveBeenCalledWith(
      candidateRecord.id,
      file,
    );

    const callOrder = [
      candidate.findUnique.mock.invocationCallOrder[0],
      mocks.deleteCv.mock.invocationCallOrder[0],
      mocks.saveCv.mock.invocationCallOrder[0],
      candidate.update.mock.invocationCallOrder[0],
      mocks.indexCandidateCv.mock.invocationCallOrder[0],
    ];
    expect(callOrder).toEqual([...callOrder].sort((left, right) => left - right));
  });
});
