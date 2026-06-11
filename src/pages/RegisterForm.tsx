import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowRight, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import { API_BASE_URL } from "../config/env";

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
    .refine((val) => /[A-Z]/.test(val), {
      message: "Mật khẩu phải chứa ít nhất một chữ hoa",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Mật khẩu phải chứa ít nhất một chữ thường",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Mật khẩu phải chứa ít nhất một chữ số",
    })
    .refine((val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(val), {
      message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt",
    }),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "Bắt buộc đồng ý điều khoản",
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
      console.error("Lỗi từ Server:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
            "Đăng ký thất bại, vui lòng thử lại!",
        );
      } else {
        toast.error("Không thể kết nối server, vui lòng thử lại!");
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
          className='text-sm font-bold text-[var(--sahara-muted)] transition-colors hover:text-[var(--sahara-primary)]'
        >
          Đăng nhập
        </Link>
      </nav>

      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center py-8'>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='sahara-card w-full max-w-lg space-y-4 p-7 text-[var(--sahara-text)]'
        >
          <div>
            <p className='mb-2 text-xs font-black uppercase text-[var(--sahara-primary)]'>
              ATS PRO
            </p>
            <h1 className='text-3xl font-black tracking-normal'>
              Tạo tài khoản
            </h1>
            <p className='mt-2 text-sm text-[var(--sahara-muted)]'>
              Bắt đầu quản lý pipeline tuyển dụng trong một workspace ấm và gọn.
            </p>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-bold'>Họ và tên</label>
            <div className='relative'>
              <UserRound
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sahara-muted)]'
              />
              <input
                placeholder='Ví dụ: Nguyễn Văn A'
                type='text'
                className='sahara-input h-11 w-full px-10 text-sm'
                {...register("fullName")}
              />
            </div>
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.fullName?.message}
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-1.5 block text-sm font-bold'>
                Địa chỉ Email
              </label>
              <div className='relative'>
                <Mail
                  size={17}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sahara-muted)]'
                />
                <input
                  placeholder='email@example.com'
                  type='email'
                  className='sahara-input h-11 w-full px-10 text-sm'
                  {...register("email")}
                />
              </div>
              <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
                {errors.email?.message}
              </p>
            </div>

            <div>
              <label className='mb-1.5 block text-sm font-bold'>
                Giới tính
              </label>
              <select
                className='sahara-input h-11 w-full px-3 text-sm'
                {...register("gender")}
              >
                <option value='nam'>Nam</option>
                <option value='nữ'>Nữ</option>
                <option value='khác'>Khác</option>
              </select>
              <p className='mt-1 min-h-[20px]' />
            </div>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-bold'>Mật khẩu</label>
            <div className='relative'>
              <ShieldCheck
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sahara-muted)]'
              />
              <input
                placeholder='Mật khẩu'
                type='password'
                className='sahara-input h-11 w-full px-10 text-sm'
                {...register("password")}
              />
            </div>
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.password?.message}
            </p>
          </div>

          <div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='terms'
                className='h-4 w-4 cursor-pointer rounded border-[#d8c8b5] text-[var(--sahara-primary)] focus:ring-[var(--sahara-primary)]'
                {...register("agreeTerms")}
              />
              <label
                htmlFor='terms'
                className='cursor-pointer select-none text-sm text-[var(--sahara-muted)]'
              >
                Tôi đồng ý với điều khoản dịch vụ
              </label>
            </div>
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.agreeTerms?.message}
            </p>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>

          <p className='text-center text-sm text-[var(--sahara-muted)]'>
            Đã có tài khoản?{" "}
            <Link
              to='/login'
              className='font-black text-[var(--sahara-primary)] transition-colors hover:text-[var(--sahara-primary-dark)]'
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </section>
      <ToastContainer position='bottom-right' />
    </main>
  );
};

export default RegisterForm;
