import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

// Tinh chỉnh lại z.string().email() cho chuẩn v4 để không báo lỗi
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
  agreeTerms: z
    .boolean()
    .refine((val) => val === true, { message: "Bắt buộc đồng ý điều khoản" }),
});

type RegisterFormType = z.infer<typeof registerSchema>;

const RegisterForm = () => {
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
      const res = await axios.post("https://dummyjson.com/users/add", {
        firstName: data.fullName,
        email: data.email,
        gender: data.gender,
        password: data.password,
      });
      console.log("Thông tin đăng nhập:", res.data);
      toast.success("Đăng ký thành công!");
      reset();
    } catch (error) {
      console.error("Lỗi từ Server:", error);
      toast.error("Đăng ký thất bại, vui lòng thử lại!");
    }
  };

  return (
    // 1. Thẻ bọc ngoài cùng: Nền xám, căn giữa toàn màn hình
    <div className='min-h-screen bg-gray-100 flex items-center justify-center p-4'>
      {/* 2. Khối Form: Nền trắng, bo góc (rounded-xl), đổ bóng (shadow-lg), rộng tối đa (max-w-md) */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white w-full max-w-md p-8 rounded-xl shadow-lg space-y-5'
      >
        {/* Tiêu đề form */}
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>
          Tạo Tài Khoản
        </h2>

        {/* 3. Nhóm Họ và tên */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Họ và tên
          </label>
          <input
            placeholder='Ví dụ: Nguyễn Văn A'
            type='text'
            // CSS Input: Viền xám, bo góc, padding, hiệu ứng viền xanh khi nhấp vào
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            {...register("fullName")}
          />
          {/* Lỗi đỏ dùng Tailwind thay cho style inline, thêm min-h để không nhảy form */}
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.fullName?.message}
          </p>
        </div>
        {/* Nhóm Password */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Mật khẩu
          </label>
          <input
            placeholder='Mật khẩu'
            type='password'
            // CSS Input: Viền xám, bo góc, padding, hiệu ứng viền xanh khi nhấp vào
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            {...register("password")}
          />
          {/* Lỗi đỏ dùng Tailwind thay cho style inline, thêm min-h để không nhảy form */}
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.password?.message}
          </p>
        </div>

        {/* Nhóm Email */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Địa chỉ Email
          </label>
          <input
            placeholder='email@example.com'
            type='email'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            {...register("email")}
          />
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.email?.message}
          </p>
        </div>

        {/* Nhóm Giới tính */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Giới tính
          </label>
          <select
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white'
            {...register("gender")}
          >
            <option value='nam'>Nam</option>
            <option value='nữ'>Nữ</option>
            <option value='khác'>Khác</option>
          </select>
          <p className='min-h-[20px]'></p>
        </div>

        {/* Nhóm Checkbox */}
        <div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='terms'
              className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer'
              {...register("agreeTerms")}
            />
            <label
              htmlFor='terms'
              className='text-sm text-gray-600 cursor-pointer select-none'
            >
              Tôi đồng ý với điều khoản dịch vụ
            </label>
          </div>
          <p className='text-red-500 text-sm mt-1 min-h-[20px]'>
            {errors.agreeTerms?.message}
          </p>
        </div>

        {/* Nút Submit */}
        <button
          type='submit'
          disabled={isSubmitting}
          // Nút bấm xanh, bo góc, đổi màu mờ đi nếu đang submit
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all duration-200 
            ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"}`}
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
        </button>
      </form>

      <ToastContainer position='bottom-right' />
    </div>
  );
};

export default RegisterForm;
