import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let mailerConfigured = false;
let mailerReady = false;

export type EmailDeliveryResult = {
  sent: boolean;
  reason?: "not_configured" | "send_failed";
};

export const getMailerHealth = () => ({
  configured: mailerConfigured,
  ready: mailerReady,
});

export const initMailer = async () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  mailerConfigured = Boolean(user && pass && user !== "your_gmail@gmail.com");
  mailerReady = false;

  if (!mailerConfigured || !user || !pass) {
    console.warn("⚠️  Gmail chưa được cấu hình. Email sẽ không được gửi.");
    return;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    mailerReady = true;
    console.log(`📧 Gmail SMTP sẵn sàng (${user})`);
  } catch (error) {
    console.error("❌ Lỗi xác thực Gmail:", error);
    transporter = null;
    mailerReady = false;
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<EmailDeliveryResult> => {
  if (!transporter) {
    console.warn(`📭 Email không gửi được (chưa cấu hình Gmail): ${to}`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    await transporter.sendMail({
      from: `"ATSPRO Tuyển dụng" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Đã gửi email tới: ${to}`);
    return { sent: true };
  } catch (error) {
    console.error(`❌ Lỗi khi gửi email tới ${to}:`, error);
    return { sent: false, reason: "send_failed" };
  }
};
