import express, { type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AuthRequest } from "../routes/authMiddleware";
import {
  createApiRateLimiter,
  getAiRateLimitKey,
} from "./rateLimit";

const ok = (_req: Request, res: Response) => res.json({ ok: true });

describe("API rate limiting", () => {
  it("returns a JSON 429 response with standard rate-limit headers", async () => {
    const app = express();
    app.get(
      "/limited",
      createApiRateLimiter({
        identifier: "test-ip",
        windowMs: 60_000,
        limit: 2,
        message: "Too many test requests",
      }),
      ok,
    );

    expect((await request(app).get("/limited")).status).toBe(200);
    expect((await request(app).get("/limited")).status).toBe(200);
    const blocked = await request(app).get("/limited");

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: "Too many test requests" });
    expect(blocked.headers.ratelimit).toBeDefined();
    expect(blocked.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("isolates AI quotas by authenticated user", async () => {
    const app = express();
    app.use((req: AuthRequest, _res, next) => {
      req.user = {
        userId: String(req.headers["x-test-user"]),
        email: "test@example.com",
        role: "hr",
      };
      next();
    });
    app.get(
      "/ai",
      createApiRateLimiter({
        identifier: "test-ai",
        windowMs: 60_000,
        limit: 1,
        message: "AI quota exceeded",
        keyGenerator: getAiRateLimitKey,
      }),
      ok,
    );

    expect(
      (await request(app).get("/ai").set("x-test-user", "user-a")).status,
    ).toBe(200);
    expect(
      (await request(app).get("/ai").set("x-test-user", "user-b")).status,
    ).toBe(200);
    expect(
      (await request(app).get("/ai").set("x-test-user", "user-a")).status,
    ).toBe(429);
  });
});
