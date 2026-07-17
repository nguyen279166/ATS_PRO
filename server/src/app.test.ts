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
});
