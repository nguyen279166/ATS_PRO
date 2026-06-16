import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { apiClient } from "../api/client";
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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormType) => {
    try {
      const res = await apiClient.post("/api/auth/login", data);
      const token = res.data.token;
      const role = res.data.user?.role || "hr";
      if (!token) {
        throw new Error("API không trả về token");
      }

      login(token, role);
      toast.success("Đăng nhập thành công");
    } catch (error) {
      console.log("Lỗi đăng nhập:", error);
      toast.error("Sai email hoặc mật khẩu");
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
          to='/careers'
          className='text-sm font-bold text-[var(--sahara-muted)] transition-colors hover:text-[var(--sahara-primary)]'
        >
          Việc đang tuyển
        </Link>
      </nav>

      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center py-8'>
        <form
          className='sahara-card w-full max-w-md space-y-5 p-7 text-[var(--sahara-text)]'
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <p className='mb-2 text-xs font-black uppercase text-[var(--sahara-primary)]'>
              Sahara workspace
            </p>
            <h1 className='text-3xl font-black tracking-normal'>Đăng nhập</h1>
            <p className='mt-2 text-sm text-[var(--sahara-muted)]'>
              Quay lại bảng tuyển dụng ATS PRO của bạn.
            </p>
          </div>

          <div>
            <label className='mb-1.5 block text-sm font-bold'>Email</label>
            <div className='relative'>
              <Mail
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sahara-muted)]'
              />
              <input
                className='sahara-input h-11 w-full px-10 text-sm'
                type='email'
                placeholder='john@mail.com'
                {...register("email")}
              />
            </div>
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.email?.message}
            </p>
          </div>

          <div>
            <div className='mb-1.5 flex items-center justify-between gap-3'>
              <label className='block text-sm font-bold'>Mật khẩu</label>
              <Link
                to='/forgot-password'
                className='text-sm font-bold text-[var(--sahara-primary)] transition-colors hover:text-[var(--sahara-primary-dark)]'
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className='relative'>
              <LockKeyhole
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sahara-muted)]'
              />
              <input
                className='sahara-input h-11 w-full px-10 text-sm'
                type='password'
                placeholder='changeme'
                {...register("password")}
              />
            </div>
            <p className='mt-1 min-h-[20px] text-sm font-medium text-[#9a452a]'>
              {errors.password?.message}
            </p>
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='sahara-button h-11 w-full disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSubmitting ? "Đang kiểm tra..." : "Đăng nhập"}
            {!isSubmitting && <ArrowRight size={17} />}
          </button>

          <p className='text-center text-sm text-[var(--sahara-muted)]'>
            Chưa có tài khoản?{" "}
            <Link
              to='/register'
              className='font-black text-[var(--sahara-primary)] transition-colors hover:text-[var(--sahara-primary-dark)]'
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginForm;
