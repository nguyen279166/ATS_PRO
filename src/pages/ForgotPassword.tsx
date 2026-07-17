import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";
import {
  AuthField,
  AuthHeading,
  AuthPage,
} from "../features/auth/AuthScaffold";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Vui lòng nhập đúng định dạng email" })),
});

type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordResponse = {
  message: string;
  devResetUrl?: string;
};

export default function ForgotPassword() {
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormType) => {
    try {
      const response = await axios.post<ForgotPasswordResponse>(
        `${API_BASE_URL}/api/auth/forgot-password`,
        data,
      );
      setSubmittedEmail(data.email);
      setDevResetUrl(response.data.devResetUrl || "");
      toast.success(response.data.message);
    } catch (error) {
      console.error("Lỗi gửi email đặt lại mật khẩu:", error);
      toast.error("Không thể gửi yêu cầu, vui lòng thử lại");
    }
  };

  let resetPath = "";
  if (devResetUrl) {
    try {
      const url = new URL(devResetUrl);
      resetPath = `${url.pathname}${url.search}`;
    } catch {
      resetPath = "";
    }
  }

  return (
    <AuthPage
      navLink={{
        to: "/login",
        label: "Đăng nhập",
        icon: <ArrowLeft aria-hidden='true' size={16} />,
      }}
    >
      <form
        className='sahara-card w-full max-w-md space-y-5 p-6 text-[var(--color-text)] sm:p-8'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <AuthHeading
          eyebrow='Khôi phục tài khoản'
          title='Quên mật khẩu'
          description='Nhập email tài khoản. Nếu email tồn tại, hệ thống sẽ gửi cho bạn liên kết đặt lại mật khẩu.'
          icon={<MailCheck aria-hidden='true' size={24} />}
        />

        <AuthField
          id='forgot-email'
          label='Email'
          type='email'
          inputMode='email'
          autoComplete='email'
          placeholder='ban@congty.vn'
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />

        <button
          type='submit'
          disabled={isSubmitting}
          className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSubmitting ? "Đang gửi..." : "Gửi email khôi phục"}
          {!isSubmitting && <Send aria-hidden='true' size={17} />}
        </button>

        {submittedEmail && (
          <div
            role='status'
            className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm leading-6 text-[var(--color-text-muted)]'
          >
            Đã nhận yêu cầu cho <strong>{submittedEmail}</strong>. Hãy kiểm tra
            hộp thư đến và thư rác.
            {resetPath && (
              <Link
                to={resetPath}
                className='mt-3 block rounded font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]'
              >
                Mở liên kết đặt lại trong môi trường phát triển
              </Link>
            )}
          </div>
        )}
      </form>
    </AuthPage>
  );
}
