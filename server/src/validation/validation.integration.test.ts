import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import app from "../app";

const validId = "550e8400-e29b-41d4-a716-446655440000";
let authorization = "";

beforeAll(() => {
  vi.stubEnv("JWT_SECRET", "validation-integration-secret");
  authorization = `Bearer ${jwt.sign(
    { userId: validId, email: "hr@example.com", role: "hr" },
    process.env.JWT_SECRET as string,
  )}`;
});

afterAll(() => vi.unstubAllEnvs());

describe("server-side request validation", () => {
  it("rejects invalid candidate pagination and date ranges", async () => {
    const invalidPage = await request(app)
      .get("/api/candidates?page=0")
      .set("Authorization", authorization);
    const invalidRange = await request(app)
      .get("/api/candidates?dateFrom=2026-07-31&dateTo=2026-07-01")
      .set("Authorization", authorization);

    expect(invalidPage.status).toBe(400);
    expect(invalidPage.body.details).toEqual([
      expect.objectContaining({ field: "query.page" }),
    ]);
    expect(invalidRange.status).toBe(400);
    expect(invalidRange.body.details).toEqual([
      expect.objectContaining({ field: "query.dateTo" }),
    ]);
  });

  it("rejects invalid URL identifiers before reaching a service", async () => {
    const response = await request(app)
      .delete("/api/candidates/not-a-uuid")
      .set("Authorization", authorization);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Dữ liệu yêu cầu không hợp lệ",
      details: [expect.objectContaining({ field: "params.id" })],
    });
  });

  it("validates notes and interviews with the same error contract", async () => {
    const note = await request(app)
      .post("/api/notes")
      .set("Authorization", authorization)
      .send({ candidateId: "not-a-uuid", content: "" });
    const interview = await request(app)
      .post("/api/interviews")
      .set("Authorization", authorization)
      .send({ candidateId: validId, scheduledAt: "not-a-date" });

    expect(note.status).toBe(400);
    expect(note.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "body.candidateId" }),
        expect.objectContaining({ field: "body.content" }),
      ]),
    );
    expect(interview.status).toBe(400);
    expect(interview.body.details).toEqual([
      expect.objectContaining({ field: "body.scheduledAt" }),
    ]);
  });
});
