import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  createResetToken: vi.fn(),
  hashPassword: vi.fn(),
  hashResetToken: vi.fn(),
  signAuthToken: vi.fn(),
  verifyPassword: vi.fn(),
  sendEmail: vi.fn(),
  saveAvatar: vi.fn(),
}));

vi.mock("../../prisma", () => ({ default: mocks.prisma }));
vi.mock("./authSecurity", () => ({
  createResetToken: mocks.createResetToken,
  hashPassword: mocks.hashPassword,
  hashResetToken: mocks.hashResetToken,
  signAuthToken: mocks.signAuthToken,
  verifyPassword: mocks.verifyPassword,
}));
vi.mock("../../utils/mailer", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("../../utils/cvStorage", () => ({ saveAvatar: mocks.saveAvatar }));

import {
  changePassword,
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateAvatar,
} from "./authService";

const databaseUser = {
  id: "user-1",
  email: "hr@example.com",
  fullName: "HR User",
  role: "hr",
  password: "stored-password-hash",
};

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CLIENT_URL", "http://client.test/");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("registers only an HR user with a hashed password", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.prisma.user.create.mockResolvedValue(databaseUser);

    const result = await registerUser({
      fullName: databaseUser.fullName,
      email: databaseUser.email,
      password: "Password123",
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith("Password123");
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: {
        fullName: databaseUser.fullName,
        email: databaseUser.email,
        password: "new-password-hash",
        role: "hr",
      },
    });
    expect(result).toEqual({
      kind: "registered",
      user: {
        id: databaseUser.id,
        email: databaseUser.email,
        fullName: databaseUser.fullName,
        role: databaseUser.role,
      },
    });
  });

  it("verifies credentials and signs the same JWT identity", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(databaseUser);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.signAuthToken.mockReturnValue("signed-token");

    const result = await loginUser(databaseUser.email, "Password123");

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "Password123",
      databaseUser.password,
    );
    expect(mocks.signAuthToken).toHaveBeenCalledWith(databaseUser);
    expect(result).toMatchObject({
      kind: "authenticated",
      token: "signed-token",
      user: { id: databaseUser.id, role: "hr" },
    });
  });

  it("stores a hashed reset token and sends the extracted email template", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    mocks.prisma.user.findUnique.mockResolvedValue(databaseUser);
    mocks.createResetToken.mockReturnValue("raw-token");
    mocks.hashResetToken.mockReturnValue("hashed-token");
    mocks.prisma.user.update.mockResolvedValue(databaseUser);
    mocks.sendEmail.mockResolvedValue({ sent: true });

    const result = await requestPasswordReset("HR@EXAMPLE.COM");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: databaseUser.email },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: databaseUser.id },
      data: {
        resetPasswordToken: "hashed-token",
        resetPasswordExpires: expect.any(Date),
      },
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      databaseUser.email,
      "Đặt lại mật khẩu ATS PRO",
      expect.stringContaining(
        "http://client.test/reset-password?token=raw-token",
      ),
    );
    expect(result).toEqual({
      kind: "accepted",
      response: {
        message:
          "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
        devResetUrl: "http://client.test/reset-password?token=raw-token",
      },
    });
    logSpy.mockRestore();
  });

  it("resets a password and clears the one-time token", async () => {
    mocks.hashResetToken.mockReturnValue("hashed-token");
    mocks.prisma.user.findFirst.mockResolvedValue(databaseUser);
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.prisma.user.update.mockResolvedValue(databaseUser);

    const result = await resetPassword("raw-token", "NewPassword123");

    expect(mocks.prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        resetPasswordToken: "hashed-token",
        resetPasswordExpires: { gt: expect.any(Date) },
      },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: databaseUser.id },
      data: {
        password: "new-password-hash",
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    expect(result).toEqual({ kind: "reset" });
  });

  it("loads the selected /me fields and changes a verified password", async () => {
    const profile = {
      id: databaseUser.id,
      email: databaseUser.email,
      fullName: databaseUser.fullName,
      role: databaseUser.role,
      avatar: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(databaseUser);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.prisma.user.update.mockResolvedValue(databaseUser);

    await expect(getCurrentUser(databaseUser.id)).resolves.toEqual(profile);
    const result = await changePassword(
      databaseUser.id,
      "Password123",
      "NewPassword123",
    );

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "Password123",
      databaseUser.password,
    );
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: databaseUser.id },
      data: { password: "new-password-hash" },
    });
    expect(result).toEqual({ kind: "changed" });
  });

  it("saves an avatar before persisting its URL", async () => {
    const file = { originalname: "avatar.png" } as Express.Multer.File;
    mocks.saveAvatar.mockResolvedValue("/uploads/avatar.png");
    mocks.prisma.user.update.mockResolvedValue(databaseUser);

    await expect(updateAvatar(databaseUser.id, file)).resolves.toBe(
      "/uploads/avatar.png",
    );
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: databaseUser.id },
      data: { avatar: "/uploads/avatar.png" },
    });
  });
});
