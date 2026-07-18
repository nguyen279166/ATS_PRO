import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  listPublicJobs: vi.fn(),
  createPublicApplication: vi.fn(),
  indexPublicApplicationCv: vi.fn(),
}));

vi.mock("./public.service", () => serviceMocks);

import publicRoutes from "../../routes/publicRoutes";

const app = express();
app.use(express.json());
app.use(publicRoutes);

const jobId = "550e8400-e29b-41d4-a716-446655440000";

describe("public route contracts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the public job list", async () => {
    const jobs = [{ id: jobId, title: "Backend Engineer" }];
    serviceMocks.listPublicJobs.mockResolvedValue(jobs);

    const response = await request(app).get("/jobs");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(jobs);
  });

  it("uploads before validation and creates an application before indexing", async () => {
    const candidate = { id: "candidate-1", name: "Nguyen Van A" };
    serviceMocks.createPublicApplication.mockResolvedValue(candidate);
    serviceMocks.indexPublicApplicationCv.mockResolvedValue({ indexed: true });

    const response = await request(app)
      .post("/apply")
      .field("jobId", jobId)
      .field("name", "Nguyen Van A")
      .field("email", "APPLICANT@EXAMPLE.COM")
      .attach("cv", Buffer.from("resume"), "resume.pdf");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Ứng tuyển thành công!",
      candidate,
    });
    expect(serviceMocks.createPublicApplication).toHaveBeenCalledWith({
      jobId,
      name: "Nguyen Van A",
      email: "applicant@example.com",
      file: expect.objectContaining({
        fieldname: "cv",
        originalname: "resume.pdf",
      }),
    });
    expect(serviceMocks.indexPublicApplicationCv).toHaveBeenCalledWith(
      "candidate-1",
      expect.objectContaining({ originalname: "resume.pdf" }),
    );
    expect(
      serviceMocks.createPublicApplication.mock.invocationCallOrder[0],
    ).toBeLessThan(
      serviceMocks.indexPublicApplicationCv.mock.invocationCallOrder[0],
    );
  });

  it("keeps the unavailable-job response contract", async () => {
    serviceMocks.createPublicApplication.mockResolvedValue(null);

    const response = await request(app).post("/apply").send({
      jobId,
      name: "Nguyen Van A",
      email: "a@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Công việc này không còn nhận ứng viên",
    });
    expect(serviceMocks.indexPublicApplicationCv).not.toHaveBeenCalled();
  });

  it("keeps validation ahead of the controller", async () => {
    const response = await request(app).post("/apply").send({
      jobId: "not-a-uuid",
      name: "Nguyen Van A",
      email: "a@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Dữ liệu yêu cầu không hợp lệ");
    expect(serviceMocks.createPublicApplication).not.toHaveBeenCalled();
  });
});
