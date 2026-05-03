import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../prisma";
import authMiddleware from "./authMiddleware";

const router = Router();

// ========================
// Cấu hình Multer cho Upload File
// ========================
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Đổi tên file để tránh trùng lặp: timestamp-tên_gốc
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

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
    console.error("Login error:", error);
    res.status(500).json({ error: "Lỗi server khi đăng nhập" });
  }
});

// ========================
// GET /api/auth/me → Lấy thông tin user hiện tại
// ========================
router.get("/me", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy thông tin cá nhân" });
  }
});

// ========================
// PUT /api/auth/password → Đổi mật khẩu
// ========================
router.put("/password", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
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
});

// ========================
// POST /api/auth/upload → Upload ảnh đại diện
// ========================
router.post("/upload", authMiddleware, upload.single("avatar"), async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    if (!req.file) {
      return res.status(400).json({ error: "Không có file nào được tải lên" });
    }

    // Tạo URL để truy cập file từ Frontend
    // File được lưu trong thư mục uploads/ với tên mới
    const avatarUrl = `http://localhost:3001/uploads/${req.file.filename}`;

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
});

export default router;
