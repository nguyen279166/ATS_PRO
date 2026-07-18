import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { cvUpload } from "../utils/cvStorage";
import { ApiError, errorHandler, notFoundHandler } from "./errorHandler";

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.get("/expected", () => {
    throw new ApiError(403, "Expected error", [{ field: "test" }]);
  });
  app.get("/unexpected", () => {
    throw new Error("private database detail");
  });
  app.post("/upload", cvUpload.single("cv"), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe("global API errors", () => {
  it("preserves expected status and details", async () => {
    const response = await request(createTestApp()).get("/expected");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "Expected error",
      details: [{ field: "test" }],
    });
  });

  it("does not expose unexpected error details", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(createTestApp()).get("/unexpected");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Lỗi server nội bộ" });
    expect(JSON.stringify(response.body)).not.toContain("private database");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("normalizes upload and unknown-route errors as JSON", async () => {
    const upload = await request(createTestApp())
      .post("/upload")
      .attach("cv", Buffer.from("text"), "resume.txt");
    const missing = await request(createTestApp()).get("/missing");

    expect(upload.status).toBe(400);
    expect(upload.body.error).toBe(
      "Chỉ chấp nhận file PDF, DOC, DOCX, JPG, PNG",
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({
      error: "Không tìm thấy endpoint",
      path: "/missing",
    });
  });
});
