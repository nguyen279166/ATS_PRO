import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";

type ValidationSource = "body" | "query" | "params";
type RequestSchemas = Partial<Record<ValidationSource, ZodType>>;

export type ValidatedRequest = Partial<Record<ValidationSource, unknown>>;

const formatZodError = (error: ZodError, source: ValidationSource) =>
  error.issues.map((issue) => ({
    field: [source, ...issue.path].join("."),
    message: issue.message,
  }));

export const validateRequest = (schemas: RequestSchemas): RequestHandler =>
  (req, res, next) => {
    const validatedRequest: ValidatedRequest = {
      ...(res.locals.validatedRequest as ValidatedRequest | undefined),
    };

    for (const source of ["params", "query", "body"] as const) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        res.status(400).json({
          error: "Dữ liệu yêu cầu không hợp lệ",
          details: formatZodError(result.error, source),
        });
        return;
      }

      validatedRequest[source] = result.data;
      if (source === "body") req.body = result.data;
    }

    res.locals.validatedRequest = validatedRequest;
    next();
  };

export const getValidatedRequest = <T>(
  res: Response,
  source: ValidationSource,
) => (res.locals.validatedRequest as ValidatedRequest | undefined)?.[
  source
] as T | undefined;

export const validateBody = (schema: ZodType): RequestHandler =>
  validateRequest({ body: schema });

export const validateQuery = (schema: ZodType): RequestHandler =>
  validateRequest({ query: schema });

export const validateParams = (schema: ZodType): RequestHandler =>
  validateRequest({ params: schema });
