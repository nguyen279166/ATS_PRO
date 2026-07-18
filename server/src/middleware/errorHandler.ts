import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isMalformedJsonError = (error: unknown) =>
  error instanceof SyntaxError &&
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  error.status === 400 &&
  "body" in error;

const isUploadTypeError = (error: unknown): error is Error =>
  error instanceof Error && error.message.startsWith("Chỉ chấp nhận file");

const getPrismaError = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  if (error.code === "P2025") {
    return new ApiError(404, "Không tìm thấy dữ liệu yêu cầu");
  }
  if (error.code === "P2002") {
    return new ApiError(409, "Dữ liệu đã tồn tại");
  }
  if (error.code === "P2003") {
    return new ApiError(400, "Dữ liệu liên kết không hợp lệ");
  }
  return null;
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "Không tìm thấy endpoint",
    path: req.originalUrl,
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.details !== undefined && { details: error.details }),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const fileTooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(fileTooLarge ? 413 : 400).json({
      error: fileTooLarge
        ? "Tệp tải lên vượt quá dung lượng cho phép"
        : "Không thể xử lý tệp tải lên",
    });
    return;
  }

  if (isUploadTypeError(error)) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (isMalformedJsonError(error)) {
    res.status(400).json({ error: "JSON không hợp lệ" });
    return;
  }

  const prismaError = getPrismaError(error);
  if (prismaError) {
    res.status(prismaError.statusCode).json({ error: prismaError.message });
    return;
  }

  console.error("Unhandled API error:", error);
  res.status(500).json({ error: "Lỗi server nội bộ" });
};
