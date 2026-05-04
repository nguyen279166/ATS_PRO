import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

// Khởi tạo Transporter với Ethereal (Tài khoản email test)
export const initMailer = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true cho 465, false cho các port khác
      auth: {
        user: testAccount.user, // Email giả lập sinh ra ngẫu nhiên
        pass: testAccount.pass, // Pass giả lập sinh ra ngẫu nhiên
      },
    });

    console.log("📧 Ethereal Email Ready!");
    console.log(`✉️  User: ${testAccount.user}`);
  } catch (error) {
    console.error("Lỗi khi khởi tạo Mailer:", error);
  }
};

// Hàm gửi email
export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    console.error("Transporter chưa được khởi tạo!");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"ATS System" <no-reply@ats-system.local>', // Địa chỉ người gửi
      to, // Người nhận
      subject, // Tiêu đề
      html, // Nội dung dạng HTML
    });

    console.log(`✅ Đã gửi email tới: ${to}`);
    // Rất quan trọng: Ethereal cho phép xem email đã gửi thông qua URL này
    console.log(`🔗 Link xem trước email: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
  }
};
