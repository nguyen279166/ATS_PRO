import { createHash, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const PASSWORD_SALT_ROUNDS = 10;

export type AuthTokenUser = {
  id: string;
  email: string;
  role: string;
};

export const createResetToken = () => randomBytes(32).toString("hex");

export const hashResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const hashPassword = (password: string) =>
  bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

export const verifyPassword = (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);

export const signAuthToken = (user: AuthTokenUser) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
