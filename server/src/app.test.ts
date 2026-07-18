import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app";

describe("app contracts", () => {
  it("reports server and mailer health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "OK",
      mail: {
        provider: null,
        configured: false,
        ready: false,
        errorCode: null,
      },
    });
  });

  it.each([
    "/api/jobs",
    "/api/candidates",
    "/api/notes",
    "/api/interviews",
    "/api/export",
  ])("protects %s from unauthenticated requests", async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Không có token - Vui lòng đăng nhập",
    });
  });

  it("returns JSON for missing endpoints and malformed JSON", async () => {
    const missing = await request(app).get("/api/does-not-exist");
    const malformed = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({
      error: "Không tìm thấy endpoint",
      path: "/api/does-not-exist",
    });
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: "JSON không hợp lệ" });
  });

  it("normalizes rejected CORS origins as a JSON 403", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://untrusted.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Nguồn yêu cầu không được phép" });
  });
});
