import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";
import {
  AuthField,
  AuthHeading,
  AuthPage,
  PasswordField,
} from "../features/auth/AuthScaffold";

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(5, { message: "Tên phải dài ít nhất 5 ký tự" }),
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Vui lòng nhập đúng định dạng email" })),
  gender: z.enum(["nam", "nữ", "khác"]),
  password: z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .refine((value) => /[A-Z]/.test(value), {
      message: "Mật khẩu phải chứa ít nhất một chữ hoa",
    })
    .refine((value) => /[a-z]/.test(value), {
      message: "Mật khẩu phải chứa ít nhất một chữ thường",
    })
    .refine((value) => /[0-9]/.test(value), {
      message: "Mật khẩu phải chứa ít nhất một chữ số",
    })
    .refine((value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(value), {
      message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt",
    }),
  agreeTerms: z.boolean().refine((value) => value, {
    message: "Bạn cần đồng ý với điều khoản dịch vụ",
  }),
});

type RegisterFormType = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      gender: "nam",
      agreeTerms: false,
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormType) => {
    try {
      const { fullName, email, gender, password } = data;
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        fullName,
        email,
        gender,
        password,
      });
      toast.success("Đăng ký thành công!");
      reset();
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      console.error("Lỗi từ máy chủ:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
            "Đăng ký thất bại, vui lòng thử lại!",
        );
      } else {
        toast.error("Không thể kết nối máy chủ, vui lòng thử lại!");
      }
    }
  };

  return (
    <AuthPage navLink={{ to: "/login", label: "Đăng nhập" }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='sahara-card w-full max-w-lg space-y-4 p-6 text-[var(--color-text)] sm:p-8'
        noValidate
      >
        <AuthHeading
          eyebrow='ATS PRO'
          title='Tạo tài khoản'
          description='Bắt đầu quản lý quy trình tuyển dụng trong một workspace gọn gàng và dễ theo dõi.'
        />

        <AuthField
          id='register-name'
          label='Họ và tên'
          type='text'
          autoComplete='name'
          placeholder='Ví dụ: Nguyễn Văn A'
          icon={UserRound}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <div className='grid gap-4 sm:grid-cols-2'>
          <AuthField
            id='register-email'
            label='Địa chỉ email'
            type='email'
            inputMode='email'
            autoComplete='email'
            placeholder='ban@congty.vn'
            icon={Mail}
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <label
              htmlFor='register-gender'
              className='mb-1.5 block text-sm font-bold'
            >
              Giới tính
            </label>
            <select
              id='register-gender'
              autoComplete='sex'
              className='sahara-input h-11 w-full px-3 text-sm'
              {...register("gender")}
            >
              <option value='nam'>Nam</option>
              <option value='nữ'>Nữ</option>
              <option value='khác'>Khác</option>
            </select>
            <span aria-hidden='true' className='mt-1 block min-h-5' />
          </div>
        </div>

        <div>
          <p className='mb-1.5 text-sm font-bold'>Vai trò tài khoản</p>
          <div className='sahara-input flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm'>
            <span className='flex items-center gap-2 font-bold'>
              <ShieldCheck
                aria-hidden='true'
                size={17}
                className='text-[var(--color-primary)]'
              />
              HR / Nhân sự
            </span>
            <span className='rounded-md bg-[var(--color-surface-strong)] px-2 py-1 text-[11px] font-bold text-[var(--color-primary)]'>
              Mặc định
            </span>
          </div>
          <p className='mt-1 text-xs leading-5 text-[var(--color-text-muted)]'>
            Quyền quản trị chỉ được cấp bởi quản trị viên hệ thống.
          </p>
        </div>

        <PasswordField
          id='register-password'
          label='Mật khẩu'
          autoComplete='new-password'
          placeholder='Tối thiểu 8 ký tự'
          error={errors.password?.message}
          {...register("password")}
        />

        <div>
          <div className='flex items-start gap-3'>
            <input
              type='checkbox'
              id='register-terms'
              aria-invalid={Boolean(errors.agreeTerms)}
              aria-describedby={
                errors.agreeTerms ? "register-terms-error" : undefined
              }
              className='mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-focus)]'
              {...register("agreeTerms")}
            />
            <label
              htmlFor='register-terms'
              className='cursor-pointer select-none text-sm leading-6 text-[var(--color-text-muted)]'
            >
              Tôi đồng ý với điều khoản dịch vụ
            </label>
          </div>
          <p
            id='register-terms-error'
            role={errors.agreeTerms ? "alert" : undefined}
            className='mt-1 min-h-5 text-sm font-medium text-[var(--color-danger)]'
          >
            {errors.agreeTerms?.message}
          </p>
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
          {!isSubmitting && <ArrowRight aria-hidden='true' size={17} />}
        </button>

        <p className='text-center text-sm text-[var(--color-text-muted)]'>
          Đã có tài khoản?{" "}
          <Link
            to='/login'
            className='rounded font-black text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]'
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthPage>
  );
};

export default RegisterForm;
