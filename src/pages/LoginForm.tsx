import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../hooks/AuthContext";

const MOCK_LOGIN_API = "https://api.escuelajs.co/api/v1/auth/login";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Vui lòng nhập đúng định dạng email" })),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
});

type LoginFormType = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login } = useContext(AuthContext);

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
      const res = await axios.post(MOCK_LOGIN_API, {
        email: data.email,
        password: data.password,
      });
      const token = res.data.access_token;
      if (!token) {
        throw new Error("API không trả về token");
      }
      login(token);
      toast.success("Đăng nhập thành công");
    } catch (error) {
      console.log("Lỗi đăng nhập:", error);
      toast.error("Sai email hoặc mật khẩu");
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4'>
      <form
        className='w-full max-w-sm p-8 rounded-2xl space-y-5 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl'
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Logo */}
        <div className='text-center mb-4'>
          <h1 className='text-2xl font-bold text-blue-400 tracking-wider'>
            ATS<span className='text-white'>PRO</span>
          </h1>
        </div>
        <h2 className='text-2xl font-bold text-center text-white'>Đăng nhập</h2>

        {/* Email Input */}
        <div>
          <label className='block text-sm font-medium mb-1 text-slate-300'>
            Email
          </label>
          <input
            className='block border border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all rounded-xl w-full h-11 px-4'
            type='text'
            placeholder='john@mail.com'
            {...register("email")}
          />
          <p className='text-red-400 text-sm mt-1 min-h-[20px]'>
            {errors.email?.message}
          </p>
        </div>

        {/* Password Input */}
        <div>
          <label className='block text-sm font-medium mb-1 text-slate-300'>
            Mật khẩu
          </label>
          <input
            className='block border border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all rounded-xl w-full h-11 px-4'
            type='password'
            placeholder='changeme'
            {...register("password")}
          />
          <p className='text-red-400 text-sm mt-1 min-h-[20px]'>
            {errors.password?.message}
          </p>
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className={`w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 ${isSubmitting ? "bg-blue-400/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/25"}`}
        >
          {isSubmitting ? "Đang kiểm tra..." : "Đăng nhập"}
        </button>

        {/* Link sang trang Đăng ký */}
        <p className='text-center text-sm text-slate-400'>
          Chưa có tài khoản?{" "}
          <a
            href='/register'
            className='text-blue-400 hover:text-blue-300 font-semibold transition-colors'
          >
            Đăng ký ngay
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
