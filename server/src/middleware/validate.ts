import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));

export const validateBody =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Du lieu gui len khong hop le",
        details: formatZodError(result.error),
      });
      return;
    }

    req.body = result.data;
    next();
  };
