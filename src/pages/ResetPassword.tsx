import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại chưa khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormType) => {
    if (!token) {
      toast.error("Link đặt lại mật khẩu không hợp lệ");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        password: data.password,
      });
      toast.success("Đặt lại mật khẩu thành công");
      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      console.error("Lỗi đặt lại mật khẩu:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
            "Link không hợp lệ hoặc đã hết hạn",
        );
      } else {
        toast.error("Không thể đặt lại mật khẩu, vui lòng thử lại");
      }
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
            <KeyRound size={24} />
          </div>
          <div>
            <p className='mb-2 text-xs font-black uppercase text-[var(--sahara-primary)]'>
              Bảo mật tài khoản
            </p>
            <h1 className='text-3xl font-black tracking-normal'>
              Đặt lại mật khẩu
            </h1>
            <p className='mt-2 text-sm text-[var(--sahara-muted)]'>
              Tạo mật khẩu mới cho tài khoản ATS PRO của bạn.
            </p>
          </div>

          {!token && (
            <div className='rounded-lg border border-[#d8ad99] bg-[#f2ded4] p-3 text-sm font-bold text-[#9a452a]'>
              Link đặt lại mật khẩu thiếu token.
            </div>
          )}

          <div>
            <label className='mb-1.5 block text-sm font-bold'>
              Mật khẩu mới
            </label>
            <input
              className='sahara-input h-11 w-full px-3 text-sm'
              type='password'
              placeholder='Mật khẩu mới'
              {...register("password")}
            />
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.password?.message}
            </p>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-bold'>
              Nhập lại mật khẩu
            </label>
            <input
              className='sahara-input h-11 w-full px-3 text-sm'
              type='password'
              placeholder='Nhập lại mật khẩu'
              {...register("confirmPassword")}
            />
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.confirmPassword?.message}
            </p>
          </div>

          <button
            type='submit'
            disabled={isSubmitting || !token}
            className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </section>
    </main>
  );
}
