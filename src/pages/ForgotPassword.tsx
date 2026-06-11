import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";

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
      const res = await axios.post<ForgotPasswordResponse>(
        `${API_BASE_URL}/api/auth/forgot-password`,
        data,
      );
      setSubmittedEmail(data.email);
      setDevResetUrl(res.data.devResetUrl || "");
      toast.success(res.data.message);
    } catch (error) {
      console.error("Lỗi gửi email đặt lại mật khẩu:", error);
      toast.error("Không thể gửi yêu cầu, vui lòng thử lại");
    }
  };

  return (
    <main className='sahara-auth-shell min-h-screen px-4 py-6'>
      <nav className='mx-auto flex w-full max-w-5xl items-center justify-between'>
        <Link to='/' className='flex items-center gap-3'>
          <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#3a302a] text-lg font-black text-[#f4b266] shadow-sm'>
            A
          </span>
          <span className='text-xl font-black tracking-normal text-[var(--sahara-text)]'>
            ATS PRO
          </span>
        </Link>
        <Link
          to='/login'
          className='inline-flex items-center gap-2 text-sm font-bold text-[var(--sahara-muted)] transition-colors hover:text-[var(--sahara-primary)]'
        >
          <ArrowLeft size={16} />
          Đăng nhập
        </Link>
      </nav>

      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center py-8'>
        <form
          className='sahara-card w-full max-w-md space-y-5 p-7 text-[var(--sahara-text)]'
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-[#f4dfbd] text-[var(--sahara-primary)]'>
            <MailCheck size={24} />
          </div>
          <div>
            <p className='mb-2 text-xs font-black uppercase text-[var(--sahara-primary)]'>
              Khôi phục tài khoản
            </p>
            <h1 className='text-3xl font-black tracking-normal'>
              Quên mật khẩu
            </h1>
            <p className='mt-2 text-sm text-[var(--sahara-muted)]'>
              Nhập email tài khoản, hệ thống sẽ gửi link đặt lại mật khẩu nếu
              email tồn tại.
            </p>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-bold'>Email</label>
            <input
              className='sahara-input h-11 w-full px-3 text-sm'
              type='email'
              placeholder='john@mail.com'
              {...register("email")}
            />
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.email?.message}
            </p>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSubmitting ? "Đang gửi..." : "Gửi email khôi phục"}
            {!isSubmitting && <Send size={17} />}
          </button>

          {submittedEmail && (
            <div className='rounded-lg border border-[#d8c8b5] bg-[#f6efe4]/80 p-4 text-sm text-[var(--sahara-muted)]'>
              Đã nhận yêu cầu cho <strong>{submittedEmail}</strong>. Hãy kiểm
              tra hộp thư và thư rác.
              {devResetUrl && (
                <Link
                  to={new URL(devResetUrl).pathname + new URL(devResetUrl).search}
                  className='mt-3 block font-black text-[var(--sahara-primary)] transition-colors hover:text-[var(--sahara-primary-dark)]'
                >
                  Mở link reset dev
                </Link>
              )}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
