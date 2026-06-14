import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import prisma from "../prisma";
import authMiddleware, { AuthRequest } from "./authMiddleware";
import { Response } from "express";
import { sendEmail } from "../utils/mailer";
import { avatarUpload, saveAvatar } from "../utils/cvStorage";

const router = Router();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_PASSWORD_MESSAGE =
  "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.";

const hashResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const getClientUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // 2. Mã hoá mật khẩu (KHÔNG BAO GIỜ lưu mật khẩu thô vào DB!)
    // Số 10 = "độ mặn" (salt rounds) - càng cao càng an toàn nhưng càng chậm
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo User mới trong Database
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword, // Lưu mật khẩu ĐÃ MÃ HOÁ
      },
    });

    // 4. Trả về (KHÔNG trả password ra ngoài!)
    res.status(201).json({
      message: "Đăng ký thành công",
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch {
    res.status(500).json({ error: "Lỗi server khi đăng ký" });
  }
});

// ========================
// POST /api/auth/login → Đăng nhập
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm User theo email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    // 2. So sánh mật khẩu: "mật khẩu gõ vào" vs "mật khẩu đã mã hoá trong DB"
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    // 3. Tạo JWT Token (thẻ ra vào)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // Thông tin gói trong token
      process.env.JWT_SECRET as string, // Con dấu bí mật
      { expiresIn: "7d" }, // Hết hạn sau 7 ngày
    );

    // 4. Trả token về cho Frontend
    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Lỗi server khi đăng nhập" });
  }
});

// ========================
// GET /api/auth/me → Lấy thông tin user hiện tại
// ========================
router.post("/forgot-password", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: RESET_PASSWORD_MESSAGE });
    }

    const rawToken = randomBytes(32).toString("hex");
    const resetPasswordToken = hashResetToken(rawToken);
    const resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    await sendEmail(
      user.email,
      "Đặt lại mật khẩu ATS PRO",
      `
        <div style="font-family: Arial, sans-serif; color: #3a302a; line-height: 1.6;">
          <h2 style="color: #8a4518;">Đặt lại mật khẩu ATS PRO</h2>
          <p>Xin chào ${user.fullName},</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link này sẽ hết hạn sau 60 phút.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #c2652a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.</p>
        </div>
      `,
    );

    const response: { message: string; devResetUrl?: string } = {
      message: RESET_PASSWORD_MESSAGE,
    };
    if (process.env.NODE_ENV !== "production") {
      response.devResetUrl = resetUrl;
      console.log(`Password reset dev link for ${user.email}: ${resetUrl}`);
    }

    res.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Lỗi server khi gửi email khôi phục" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!token) {
      return res.status(400).json({ error: "Token không hợp lệ" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    const resetPasswordToken = hashResetToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Lỗi server khi đặt lại mật khẩu" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
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
    if (!user)
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Lỗi server khi lấy thông tin cá nhân" });
  }
});

// ========================
// PUT /api/auth/password → Đổi mật khẩu
// ========================
router.put(
  "/password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res.status(404).json({ error: "Không tìm thấy người dùng" });

      // Kiểm tra mật khẩu cũ
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Mật khẩu cũ không chính xác" });
      }

      // Mã hóa mật khẩu mới
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      res.status(500).json({ error: "Lỗi server khi đổi mật khẩu" });
    }
  },
);

// ========================
// POST /api/auth/upload → Upload ảnh đại diện
// ========================
router.post(
  "/upload",
  authMiddleware,
  avatarUpload.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Không có file nào được tải lên" });
      }

      // Tạo URL để truy cập file từ Frontend
      // File được lưu trong thư mục uploads/ với tên mới
      const avatarUrl = await saveAvatar(req.file);

      // Lưu vào Database
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      res.json({ message: "Cập nhật ảnh đại diện thành công", avatarUrl });
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      res.status(500).json({ error: "Lỗi server khi upload ảnh" });
    }
  },
);

export default router;
