import prisma from "../../prisma";
import { saveAvatar } from "../../utils/cvStorage";
import { sendEmail } from "../../utils/mailer";
import {
  buildResetPasswordEmail,
  getClientUrl,
  RESET_PASSWORD_MESSAGE,
  RESET_TOKEN_TTL_MS,
} from "./authEmail";
import {
  createResetToken,
  hashPassword,
  hashResetToken,
  signAuthToken,
  verifyPassword,
} from "./authSecurity";

export type PublicAuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export type RegisterResult =
  | { kind: "email_in_use" }
  | { kind: "registered"; user: PublicAuthUser };

export type LoginResult =
  | { kind: "invalid_credentials" }
  | { kind: "authenticated"; token: string; user: PublicAuthUser };

export type ForgotPasswordResponse = {
  message: string;
  devResetUrl?: string;
};

export type ForgotPasswordResult =
  | { kind: "invalid_email" }
  | { kind: "accepted"; response: ForgotPasswordResponse };

export type ResetPasswordResult =
  | { kind: "invalid_token" }
  | { kind: "invalid_password" }
  | { kind: "invalid_or_expired" }
  | { kind: "reset" };

export type ChangePasswordResult =
  | { kind: "user_not_found" }
  | { kind: "invalid_current_password" }
  | { kind: "changed" };

const toPublicUser = (user: PublicAuthUser): PublicAuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

export const registerUser = async (
  input: RegisterInput,
): Promise<RegisterResult> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) return { kind: "email_in_use" };

  const hashedPassword = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      password: hashedPassword,
      role: "hr",
    },
  });

  return { kind: "registered", user: toPublicUser(user) };
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { kind: "invalid_credentials" };

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) return { kind: "invalid_credentials" };

  return {
    kind: "authenticated",
    token: signAuthToken(user),
    user: toPublicUser(user),
  };
};

export const requestPasswordReset = async (
  emailInput: unknown,
): Promise<ForgotPasswordResult> => {
  const email =
    typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) return { kind: "invalid_email" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      kind: "accepted",
      response: { message: RESET_PASSWORD_MESSAGE },
    };
  }

  const rawToken = createResetToken();
  const resetPasswordToken = hashResetToken(rawToken);
  const resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken, resetPasswordExpires },
  });

  const emailContent = buildResetPasswordEmail(user.fullName, resetUrl);
  await sendEmail(
    user.email,
    emailContent.subject,
    emailContent.html,
  );

  const response: ForgotPasswordResponse = {
    message: RESET_PASSWORD_MESSAGE,
  };
  if (process.env.NODE_ENV !== "production") {
    response.devResetUrl = resetUrl;
    console.log(`Password reset dev link for ${user.email}: ${resetUrl}`);
  }

  return { kind: "accepted", response };
};

export const resetPassword = async (
  tokenInput: unknown,
  passwordInput: unknown,
): Promise<ResetPasswordResult> => {
  const token = typeof tokenInput === "string" ? tokenInput : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";

  if (!token) return { kind: "invalid_token" };
  if (password.length < 8) return { kind: "invalid_password" };

  const resetPasswordToken = hashResetToken(token);
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });
  if (!user) return { kind: "invalid_or_expired" };

  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { kind: "reset" };
};

export const getCurrentUser = (userId: string | undefined) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

export const changePassword = async (
  userId: string | undefined,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { kind: "user_not_found" };

  const isPasswordValid = await verifyPassword(
    currentPassword,
    user.password,
  );
  if (!isPasswordValid) return { kind: "invalid_current_password" };

  const hashedNewPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { kind: "changed" };
};

export const updateAvatar = async (
  userId: string | undefined,
  file: Express.Multer.File,
) => {
  const avatarUrl = await saveAvatar(file);
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });
  return avatarUrl;
};
