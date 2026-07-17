import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  changePassword: vi.fn(),
  updateAvatar: vi.fn(),
}));

vi.mock("./authService", () => serviceMocks);

import authRoutes from "../../routes/authRoutes";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const user = {
  id: "user-1",
  email: "hr@example.com",
  fullName: "HR User",
  role: "hr",
};

const getToken = () =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
  );

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("JWT_SECRET", "auth-route-test-secret");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("preserves register success and duplicate-email responses", async () => {
    serviceMocks.registerUser.mockResolvedValueOnce({
      kind: "registered",
      user,
    });

    const success = await request(app).post("/api/auth/register").send({
      fullName: user.fullName,
      email: "HR@EXAMPLE.COM",
      password: "Password123",
      role: "admin",
    });

    expect(success.status).toBe(201);
    expect(success.body).toEqual({ message: "Đăng ký thành công", user });
    expect(serviceMocks.registerUser).toHaveBeenCalledWith({
      fullName: user.fullName,
      email: user.email,
      password: "Password123",
    });

    serviceMocks.registerUser.mockResolvedValueOnce({ kind: "email_in_use" });
    const duplicate = await request(app).post("/api/auth/register").send({
      fullName: user.fullName,
      email: user.email,
      password: "Password123",
    });

    expect(duplicate.status).toBe(400);
    expect(duplicate.body).toEqual({ error: "Email đã được sử dụng" });
  });

  it("preserves login success and invalid-credential responses", async () => {
    serviceMocks.loginUser.mockResolvedValueOnce({
      kind: "authenticated",
      token: "signed-token",
      user,
    });

    const success = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "Password123",
    });

    expect(success.status).toBe(200);
    expect(success.body).toEqual({
      message: "Đăng nhập thành công",
      token: "signed-token",
      user,
    });

    serviceMocks.loginUser.mockResolvedValueOnce({
      kind: "invalid_credentials",
    });
    const invalid = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrong",
    });

    expect(invalid.status).toBe(401);
    expect(invalid.body).toEqual({
      error: "Email hoặc mật khẩu không đúng",
    });
  });

  it("preserves forgot-password's generic response", async () => {
    serviceMocks.requestPasswordReset.mockResolvedValue({
      kind: "accepted",
      response: {
        message:
          "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
        devResetUrl: "http://localhost:5173/reset-password?token=raw-token",
      },
    });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "HR@EXAMPLE.COM" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message:
        "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
      devResetUrl: "http://localhost:5173/reset-password?token=raw-token",
    });
    expect(serviceMocks.requestPasswordReset).toHaveBeenCalledWith(user.email);
  });

  it("preserves reset-password success and expired-link responses", async () => {
    serviceMocks.resetPassword.mockResolvedValueOnce({ kind: "reset" });

    const success = await request(app).post("/api/auth/reset-password").send({
      token: "raw-token",
      password: "NewPassword123",
    });

    expect(success.status).toBe(200);
    expect(success.body).toEqual({ message: "Đặt lại mật khẩu thành công" });

    serviceMocks.resetPassword.mockResolvedValueOnce({
      kind: "invalid_or_expired",
    });
    const expired = await request(app).post("/api/auth/reset-password").send({
      token: "expired-token",
      password: "NewPassword123",
    });

    expect(expired.status).toBe(400);
    expect(expired.body).toEqual({
      error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    });
  });

  it("keeps /me authenticated and preserves its response", async () => {
    serviceMocks.getCurrentUser.mockResolvedValue({
      ...user,
      avatar: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const unauthenticated = await request(app).get("/api/auth/me");
    expect(unauthenticated.status).toBe(401);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${getToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...user,
      avatar: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(serviceMocks.getCurrentUser).toHaveBeenCalledWith(user.id);
  });

  it("keeps password change auth and response behavior", async () => {
    serviceMocks.changePassword.mockResolvedValueOnce({
      kind: "invalid_current_password",
    });
    const invalid = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${getToken()}`)
      .send({ currentPassword: "WrongPassword", newPassword: "NewPassword123" });

    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ error: "Mật khẩu cũ không chính xác" });

    serviceMocks.changePassword.mockResolvedValueOnce({ kind: "changed" });
    const success = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${getToken()}`)
      .send({ currentPassword: "Password123", newPassword: "NewPassword123" });

    expect(success.status).toBe(200);
    expect(success.body).toEqual({ message: "Đổi mật khẩu thành công" });
  });
});
