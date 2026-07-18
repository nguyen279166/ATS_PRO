import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getValidatedRequest, validateRequest } from "./validate";

describe("request validation middleware", () => {
  const app = express();
  app.use(express.json());
  app.post(
    "/items/:id",
    validateRequest({
      params: z.object({ id: z.uuid() }),
      query: z.object({ page: z.coerce.number().int().min(1) }),
      body: z.object({ name: z.string().trim().min(1) }),
    }),
    (req, res) => {
      res.json({
        params: getValidatedRequest(res, "params"),
        query: getValidatedRequest(res, "query"),
        body: req.body,
      });
    },
  );

  it("normalizes valid body and query data", async () => {
    const response = await request(app)
      .post("/items/550e8400-e29b-41d4-a716-446655440000?page=2")
      .send({ name: "  Nguyen Van A  ", ignored: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      query: { page: 2 },
      body: { name: "Nguyen Van A" },
    });
  });

  it("returns one consistent error contract for every request source", async () => {
    const response = await request(app)
      .post("/items/not-a-uuid?page=0")
      .send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Dữ liệu yêu cầu không hợp lệ");
    expect(response.body.details).toEqual([
      expect.objectContaining({ field: "params.id" }),
    ]);
  });
});
