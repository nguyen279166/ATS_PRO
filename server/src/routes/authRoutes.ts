import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const router = Router();

// ========================
// POST /api/auth/register → Đăng ký tài khoản mới
// ========================
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, gender } = req.body;

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
  } catch (error) {
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
    res.status(500).json({ error: "Lỗi server khi đăng nhập" });
  }
});

export default router;
