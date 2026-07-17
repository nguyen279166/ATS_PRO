import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";
import {
  AuthHeading,
  AuthPage,
  PasswordField,
} from "../features/auth/AuthScaffold";

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
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormType) => {
    if (!token) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ");
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
            "Liên kết không hợp lệ hoặc đã hết hạn",
        );
      } else {
        toast.error("Không thể đặt lại mật khẩu, vui lòng thử lại");
      }
    }
  };

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
          eyebrow='Bảo mật tài khoản'
          title='Đặt lại mật khẩu'
          description='Tạo mật khẩu mới cho tài khoản ATS PRO của bạn.'
          icon={<KeyRound aria-hidden='true' size={24} />}
        />

        {!token && (
          <div
            role='alert'
            className='rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] p-3 text-sm font-bold text-[var(--color-danger)]'
          >
            Liên kết đặt lại mật khẩu đang thiếu token. Hãy yêu cầu một liên kết
            mới.
          </div>
        )}

        <PasswordField
          id='reset-password'
          label='Mật khẩu mới'
          autoComplete='new-password'
          placeholder='Tối thiểu 8 ký tự'
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordField
          id='reset-confirm-password'
          label='Nhập lại mật khẩu'
          autoComplete='new-password'
          placeholder='Nhập lại mật khẩu mới'
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <button
          type='submit'
          disabled={isSubmitting || !token}
          className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </AuthPage>
  );
}
