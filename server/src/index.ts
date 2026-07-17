import "dotenv/config";
import app from "./app";
import { initMailer } from "./utils/mailer";

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  await initMailer(); // Khởi tạo dịch vụ gửi email
});
