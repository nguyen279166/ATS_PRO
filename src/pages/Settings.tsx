import { useState, useEffect } from "react";
import axios from "axios";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuth } from "../hooks/useAuth";
import { User, Lock, LogOut, Bell, Moon, Shield, Camera } from "lucide-react";
import { toast } from "react-toastify";

export default function Settings() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
    createdAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Settings Toggles
  const { isDark, toggleDarkMode } = useDarkMode();
  const [emailNotif, setEmailNotif] = useState(
    () => localStorage.getItem("emailNotif") !== "false",
  );

  const toggleEmailNotif = () => {
    setEmailNotif((prev) => {
      localStorage.setItem("emailNotif", (!prev).toString());
      return !prev;
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token_lay_duoc");
        const res = await axios.get("http://localhost:3001/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPwd(true);
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const baseUrl = import.meta.env.VITE_BASE_URL;
      await axios.put(
        `${baseUrl}/api/auth/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Lỗi khi đổi mật khẩu");
      } else {
        toast.error("Lỗi khi đổi mật khẩu");
      }
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploading(true);
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const res = await axios.post(`${baseUrl}/api/auth/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Cập nhật lại state profile với link ảnh mới
      setProfile({ ...profile, avatar: res.data.avatarUrl });
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Lỗi khi tải ảnh lên");
      } else {
        toast.error("Lỗi khi tải ảnh lên");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN & ĐĂNG XUẤT */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Card Profile */}
          <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 text-center transition-colors'>
            <div className='relative w-24 h-24 mx-auto mb-4 group'>
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt='Avatar'
                  className='w-24 h-24 rounded-full object-cover shadow-inner border-4 border-slate-50'
                />
              ) : (
                <div className='w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold shadow-inner'>
                  {profile?.fullName?.charAt(0).toUpperCase() || <User />}
                </div>
              )}

              {/* Nút Đổi Avatar (hiện khi hover) */}
              <label className='absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm'>
                {isUploading ? (
                  <div className='animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent'></div>
                ) : (
                  <Camera size={24} />
                )}
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            <h3 className='text-xl font-bold text-slate-800 dark:text-white'>
              {profile?.fullName}
            </h3>
            <p className='text-slate-500 dark:text-slate-400 mb-4'>
              {profile?.email}
            </p>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider'>
              <Shield size={14} /> {profile?.role || "USER"}
            </span>

            <div className='mt-6 pt-6 border-t border-slate-100 dark:border-slate-700'>
              <p className='text-xs text-slate-400 dark:text-slate-500'>
                Tham gia hệ thống từ
              </p>
              <p className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Cài đặt chung (Chỉ hiển thị UI cho đẹp) */}
          <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 transition-colors'>
            <h4 className='font-bold text-slate-800 dark:text-white mb-4'>
              Tùy chỉnh hệ thống
            </h4>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-slate-600 dark:text-slate-300'>
                  <Bell size={18} />{" "}
                  <span className='text-sm font-medium'>Thông báo Email</span>
                </div>
                <div
                  onClick={toggleEmailNotif}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${emailNotif ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${emailNotif ? "left-6" : "left-1"}`}
                  ></div>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-slate-600 dark:text-slate-300'>
                  <Moon size={18} />{" "}
                  <span className='text-sm font-medium'>Giao diện Tối</span>
                </div>
                <div
                  onClick={toggleDarkMode}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isDark ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${isDark ? "left-6" : "left-1"}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Vùng nguy hiểm */}
          <button
            onClick={logout}
            className='w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20'
          >
            <LogOut size={18} /> Đăng xuất khỏi hệ thống
          </button>
        </div>

        {/* CỘT PHẢI: ĐỔI MẬT KHẨU */}
        <div className='lg:col-span-2'>
          <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 lg:p-8 transition-colors'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-xl'>
                <Lock size={24} />
              </div>
              <div>
                <h3 className='text-xl font-bold text-slate-800 dark:text-white'>
                  Đổi mật khẩu
                </h3>
                <p className='text-slate-500 dark:text-slate-400 text-sm mt-1'>
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className='space-y-5'>
              <div>
                <label className='block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2'>
                  Mật khẩu hiện tại
                </label>
                <input
                  type='password'
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='••••••••'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                <div>
                  <label className='block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2'>
                    Mật khẩu mới
                  </label>
                  <input
                    type='password'
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                    placeholder='Mật khẩu mới'
                  />
                </div>
                <div>
                  <label className='block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2'>
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type='password'
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                    placeholder='Nhập lại mật khẩu'
                  />
                </div>
              </div>

              <div className='pt-4 flex justify-end'>
                <button
                  type='submit'
                  disabled={isChangingPwd}
                  className={`px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-sm ${
                    isChangingPwd ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isChangingPwd ? "Đang xử lý..." : "Lưu mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
