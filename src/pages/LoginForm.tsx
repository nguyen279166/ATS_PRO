import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { apiClient } from "../api/client";
import {
  AuthField,
  AuthHeading,
  AuthPage,
  PasswordField,
} from "../features/auth/AuthScaffold";
import { useAuth } from "../hooks/useAuth";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Vui lòng nhập đúng định dạng email" })),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
});

type LoginFormType = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormType) => {
    try {
      const response = await apiClient.post("/api/auth/login", data);
      const token = response.data.token;
      const role = response.data.user?.role || "hr";

      if (!token) {
        throw new Error("API không trả về token");
      }

      login(token, role);
      toast.success("Đăng nhập thành công");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      toast.error("Sai email hoặc mật khẩu");
    }
  };

  return (
    <AuthPage navLink={{ to: "/careers", label: "Việc đang tuyển" }}>
      <form
        className='sahara-card w-full max-w-md space-y-5 p-6 text-[var(--color-text)] sm:p-8'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <AuthHeading
          eyebrow='Sahara workspace'
          title='Đăng nhập'
          description='Quay lại bảng tuyển dụng ATS PRO của bạn.'
        />

        <AuthField
          id='login-email'
          label='Email'
          type='email'
          inputMode='email'
          autoComplete='email'
          placeholder='ban@congty.vn'
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          id='login-password'
          label='Mật khẩu'
          labelAction={
            <Link
              to='/forgot-password'
              className='rounded text-sm font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]'
            >
              Quên mật khẩu?
            </Link>
          }
          autoComplete='current-password'
          placeholder='Nhập mật khẩu'
          error={errors.password?.message}
          {...register("password")}
        />

        <button
          type='submit'
          disabled={isSubmitting}
          className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSubmitting ? "Đang kiểm tra..." : "Đăng nhập"}
          {!isSubmitting && <ArrowRight aria-hidden='true' size={17} />}
        </button>

        <p className='text-center text-sm text-[var(--color-text-muted)]'>
          Chưa có tài khoản?{" "}
          <Link
            to='/register'
            className='rounded font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]'
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthPage>
  );
};

export default LoginForm;
