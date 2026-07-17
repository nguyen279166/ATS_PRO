export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const RESET_PASSWORD_MESSAGE =
  "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.";

export const getClientUrl = () =>
  (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

export const buildResetPasswordEmail = (
  fullName: string,
  resetUrl: string,
) => ({
  subject: "Đặt lại mật khẩu ATS PRO",
  html: `
        <div style="font-family: Arial, sans-serif; color: #3a302a; line-height: 1.6;">
          <h2 style="color: #8a4518;">Đặt lại mật khẩu ATS PRO</h2>
          <p>Xin chào ${fullName},</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link này sẽ hết hạn sau 60 phút.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #c2652a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.</p>
        </div>
      `,
});
