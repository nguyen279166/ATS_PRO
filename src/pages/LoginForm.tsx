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
    // ... (Giữ nguyên toàn bộ phần HTML bên dưới của bạn)
    <div className={`min-h-[calc(100vh)] flex items-center justify-center p-4`}>
      <form
        className={`w-full max-w-sm p-8 rounded-xl space-y-5`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className={`text-2xl font-bold text-center`}>Đăng nhập</h2>

        {/* Email Input */}
        <div>
          <label className={`block text-sm font-medium mb-1 `}>Email</label>
          <input
            className={`block border focus:ring-2 focus:ring-blue-500 outline-none transition-all rounded-lg w-full h-10 px-3`}
            type='text'
            placeholder='john@mail.com'
            {...register("email")}
          />
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.email?.message}
          </p>
        </div>

        {/* Password Input */}
        <div>
          <label className={`block text-sm font-medium mb-1`}>Mật khẩu</label>
          <input
            className={`block border focus:ring-2 focus:ring-blue-500 outline-none transition-all rounded-lg w-full h-10 px-3`}
            type='password'
            placeholder='changeme'
            {...register("password")}
          />
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.password?.message}
          </p>
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all duration-200 ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
        >
          {isSubmitting ? "Đang kiểm tra..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
