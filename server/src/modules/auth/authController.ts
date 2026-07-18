import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../../routes/authMiddleware";
import {
  changePassword as changePasswordService,
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  updateAvatar,
} from "./authService";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await registerUser(req.body);
    if (result.kind === "email_in_use") {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    res.status(201).json({
      message: "Đăng ký thành công",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUser(req.body.email, req.body.password);
    if (result.kind === "invalid_credentials") {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    res.json({
      message: "Đăng nhập thành công",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    if (result.kind === "invalid_email") {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    res.json(result.response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await resetPasswordService(
      req.body.token,
      req.body.password,
    );
    if (result.kind === "invalid_token") {
      return res.status(400).json({ error: "Token không hợp lệ" });
    }
    if (result.kind === "invalid_password") {
      return res
        .status(400)
        .json({ error: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    if (result.kind === "invalid_or_expired") {
      return res.status(400).json({
        error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
      });
    }

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await getCurrentUser(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await changePasswordService(
      req.user?.userId,
      req.body.currentPassword,
      req.body.newPassword,
    );
    if (result.kind === "user_not_found") {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    if (result.kind === "invalid_current_password") {
      return res.status(400).json({ error: "Mật khẩu cũ không chính xác" });
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không có file nào được tải lên" });
    }

    const avatarUrl = await updateAvatar(req.user?.userId, req.file);
    res.json({ message: "Cập nhật ảnh đại diện thành công", avatarUrl });
  } catch (error) {
    next(error);
  }
};
