import type { Request } from "express";
import {
  ipKeyGenerator,
  rateLimit,
  type Options,
  type RateLimitRequestHandler,
} from "express-rate-limit";
import type { AuthRequest } from "../routes/authMiddleware";

type ApiRateLimitOptions = {
  identifier: string;
  windowMs: number;
  limit: number;
  message: string;
  keyGenerator?: Options["keyGenerator"];
};

export const createApiRateLimiter = ({
  identifier,
  windowMs,
  limit,
  message,
  keyGenerator,
}: ApiRateLimitOptions): RateLimitRequestHandler =>
  rateLimit({
    identifier,
    windowMs,
    limit,
    keyGenerator,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message },
  });

export const getAiRateLimitKey = (request: Request) => {
  const userId = (request as AuthRequest).user?.userId;
  const ipAddress = request.ip || request.socket.remoteAddress;
  return userId
    ? `user:${userId}`
    : ipAddress
      ? ipKeyGenerator(ipAddress)
      : "ip:unknown";
};

export const authRateLimiter = createApiRateLimiter({
  identifier: "auth",
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.",
});

export const publicJobsRateLimiter = createApiRateLimiter({
  identifier: "public-jobs",
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: "Bạn đang tải danh sách công việc quá nhanh. Vui lòng thử lại sau.",
});

export const publicApplyRateLimiter = createApiRateLimiter({
  identifier: "public-apply",
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Bạn đã gửi quá nhiều hồ sơ. Vui lòng thử lại sau một giờ.",
});

export const aiRateLimiter = createApiRateLimiter({
  identifier: "candidate-ai",
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: "Bạn đã dùng tính năng AI quá nhiều. Vui lòng thử lại sau 10 phút.",
  keyGenerator: getAiRateLimitKey,
});

export const ragHealthRateLimiter = createApiRateLimiter({
  identifier: "rag-health",
  windowMs: 60 * 1000,
  limit: 30,
  message: "Quá nhiều yêu cầu kiểm tra AI. Vui lòng thử lại sau.",
});
