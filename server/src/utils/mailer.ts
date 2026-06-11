import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || user === "your_gmail@gmail.com") {
    console.warn("⚠️  Gmail chưa được cấu hình. Email sẽ không được gửi.");
    return;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log(`📧 Gmail SMTP sẵn sàng (${user})`);
  } catch (error) {
    console.error("❌ Lỗi xác thực Gmail:", error);
    transporter = null;
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    console.warn(`📭 Email không gửi được (chưa cấu hình Gmail): ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"ATSPRO Tuyển dụng" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Đã gửi email tới: ${to}`);
  } catch (error) {
    console.error(`❌ Lỗi khi gửi email tới ${to}:`, error);
  }
};
