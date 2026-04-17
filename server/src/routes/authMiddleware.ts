import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Mở rộng kiểu Request để thêm thuộc tính "user"
// (Mặc định Express không biết request có "user" hay không)
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // 1. Lấy token từ Header của request
  // Frontend sẽ gửi: headers: { Authorization: "Bearer eyJhbG..." }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Không có token - Vui lòng đăng nhập" });
  }

  // 2. Tách lấy token (bỏ chữ "Bearer " phía trước)
  const token = authHeader.split(" ")[1];

  try {
    // 3. Xác thực token bằng "con dấu" JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // 4. Gắn thông tin user vào request để Route phía sau dùng
    req.user = decoded as AuthRequest["user"];

    // 5. CHO QUA → Chuyển sang Route xử lý tiếp
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

export default authMiddleware;
