import nodemailer from "nodemailer";
import { Resend } from "resend";

let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;
let mailProvider: "resend" | "gmail" | null = null;
let mailerConfigured = false;
let mailerReady = false;
let mailerErrorCode: string | null = null;

export type EmailDeliveryResult = {
  sent: boolean;
  reason?: "not_configured" | "send_failed";
};

export const getMailerHealth = () => ({
  provider: mailProvider,
  configured: mailerConfigured,
  ready: mailerReady,
  errorCode: mailerErrorCode,
});

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== "object") return "UNKNOWN";
  if ("code" in error) return String(error.code);
  if ("name" in error) return String(error.name);
  if ("statusCode" in error) return String(error.statusCode);
  return "UNKNOWN";
};

export const initMailer = async () => {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  transporter = null;
  resendClient = null;
  mailProvider = null;
  mailerConfigured = false;
  mailerReady = false;
  mailerErrorCode = null;

  if (resendApiKey) {
    resendClient = new Resend(resendApiKey);
    mailProvider = "resend";
    mailerConfigured = true;
    mailerReady = true;
    console.log("Email provider ready (Resend HTTP API)");
    return;
  }

  mailerConfigured = Boolean(user && pass && user !== "your_gmail@gmail.com");
  if (!mailerConfigured || !user || !pass) {
    console.warn("Email is not configured. Set RESEND_API_KEY or Gmail SMTP credentials.");
    return;
  }

  mailProvider = "gmail";
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
    mailerErrorCode = getErrorCode(error);
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<EmailDeliveryResult> => {
  if (resendClient) {
    try {
      const { error } = await resendClient.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL?.trim() ||
          "ATS PRO <onboarding@resend.dev>",
        to,
        subject,
        html,
      });

      if (error) throw error;

      mailerReady = true;
      mailerErrorCode = null;
      console.log(`Email sent with Resend to: ${to}`);
      return { sent: true };
    } catch (error) {
      mailerReady = false;
      mailerErrorCode = getErrorCode(error);
      console.error(`Resend failed for ${to}:`, error);
      return { sent: false, reason: "send_failed" };
    }
  }

  if (!transporter) {
    console.warn(`Email could not be sent (provider unavailable): ${to}`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    await transporter.sendMail({
      from: `"ATSPRO Tuyển dụng" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    mailerReady = true;
    mailerErrorCode = null;
    console.log(`Email sent with Gmail to: ${to}`);
    return { sent: true };
  } catch (error) {
    mailerReady = false;
    mailerErrorCode = getErrorCode(error);
    console.error(`Gmail failed for ${to}:`, error);
    return { sent: false, reason: "send_failed" };
  }
};
