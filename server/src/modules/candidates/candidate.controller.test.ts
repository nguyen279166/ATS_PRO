import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";
import { createCandidateController } from "./candidate.controller";
import {
  candidateService,
  type CandidateService,
} from "./candidate.service";

const createTestApp = (askCandidateCv: CandidateService["askCandidateCv"]) => {
  const service = {
    askCandidateCv,
    formatRagError: candidateService.formatRagError,
  } as CandidateService;
  const app = express();
  app.use(express.json());
  app.post("/candidates/:id/ask", createCandidateController(service).askCv);
  app.use(errorHandler);
  return app;
};

describe("candidate AI controller errors", () => {
  it("forwards unknown failures without exposing internal details", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const askCandidateCv = vi
      .fn<CandidateService["askCandidateCv"]>()
      .mockRejectedValue(
        Object.assign(new Error("private database detail"), {
          expose: true,
          status: 404,
          type: "provider.request.failed",
        }),
      );

    try {
      const response = await request(createTestApp(askCandidateCv))
        .post("/candidates/550e8400-e29b-41d4-a716-446655440000/ask")
        .send({ question: "Summarize this CV" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Lỗi server nội bộ" });
      expect(JSON.stringify(response.body)).not.toContain("private database");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("returns a safe service-unavailable error for known AI configuration issues", async () => {
    const askCandidateCv = vi
      .fn<CandidateService["askCandidateCv"]>()
      .mockRejectedValue(new Error("No AI provider is configured"));

    const response = await request(createTestApp(askCandidateCv))
      .post("/candidates/550e8400-e29b-41d4-a716-446655440000/ask")
      .send({ question: "Summarize this CV" });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: "Tính năng AI chưa được cấu hình hoặc chưa sẵn sàng",
    });
  });
});
