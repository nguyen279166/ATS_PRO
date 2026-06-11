import { useState, useEffect } from "react";
import axios from "axios";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuth } from "../hooks/useAuth";
import { Lock, LogOut, Bell, Moon, Shield, Camera } from "lucide-react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/env";
import Avatar from "../components/Avatar";

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
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
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
      await axios.put(
        `${API_BASE_URL}/api/auth/password`,
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
      const res = await axios.post(`${API_BASE_URL}/api/auth/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Cập nhật lại state profile với link ảnh mới
      setProfile((currentProfile) =>
        currentProfile
          ? { ...currentProfile, avatar: res.data.avatarUrl }
          : currentProfile,
      );
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
    <div className='max-w-5xl'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN & ĐĂNG XUẤT */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Card Profile */}
          <div className='sahara-card p-6 text-center transition-colors'>
            <div className='relative w-24 h-24 mx-auto mb-4 group'>
              <Avatar
                name={profile?.fullName}
                src={profile?.avatar}
                className='h-24 w-24 text-3xl shadow-inner'
                imageClassName='border-4 border-[#f4dfbd]'
              />

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

            <h3 className='text-xl font-black text-[#3a302a]'>
              {profile?.fullName}
            </h3>
            <p className='text-[#7d6f62] mb-4'>
              {profile?.email}
            </p>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4dfbd] text-[#8a4518] text-xs font-semibold uppercase tracking-wider'>
              <Shield size={14} /> {profile?.role || "USER"}
            </span>

            <div className='mt-6 pt-6 border-t border-[#d8c8b5]/70'>
              <p className='text-xs text-[#9a7655]'>
                Tham gia hệ thống từ
              </p>
              <p className='text-sm font-medium text-[#5b4a3a]'>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Cài đặt chung (Chỉ hiển thị UI cho đẹp) */}
          <div className='sahara-card p-6 transition-colors'>
            <h4 className='font-bold text-[#3a302a] mb-4'>
              Tùy chỉnh hệ thống
            </h4>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-[#5b4a3a]'>
                  <Bell size={18} />{" "}
                  <span className='text-sm font-medium'>Thông báo Email</span>
                </div>
                <div
                  onClick={toggleEmailNotif}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${emailNotif ? "bg-[#c2652a]" : "bg-[#d8c8b5]"}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${emailNotif ? "left-6" : "left-1"}`}
                  ></div>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-[#5b4a3a]'>
                  <Moon size={18} />{" "}
                  <span className='text-sm font-medium'>Giao diện Tối</span>
                </div>
                <div
                  onClick={toggleDarkMode}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isDark ? "bg-[#6f7f5a]" : "bg-[#d8c8b5]"}`}
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
            className='w-full flex items-center justify-center gap-2 py-3 bg-[#f2ded4] text-[#8c3c3c] font-bold rounded-lg hover:bg-[#e8c8b8] transition-colors border border-[#d8ad99]'
          >
            <LogOut size={18} /> Đăng xuất khỏi hệ thống
          </button>
        </div>

        {/* CỘT PHẢI: ĐỔI MẬT KHẨU */}
        <div className='lg:col-span-2'>
          <div className='sahara-card p-6 lg:p-8 transition-colors'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-3 bg-[#f4dfbd] text-[#8a4518] rounded-lg'>
                <Lock size={24} />
              </div>
              <div>
                <h3 className='text-xl font-black text-[#3a302a]'>
                  Đổi mật khẩu
                </h3>
                <p className='text-[#7d6f62] text-sm mt-1'>
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className='space-y-5'>
              <div>
                <label className='block text-sm font-bold text-[#5b4a3a] mb-2'>
                  Mật khẩu hiện tại
                </label>
                <input
                  type='password'
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='sahara-input w-full px-4 py-3'
                  placeholder='••••••••'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                <div>
                  <label className='block text-sm font-bold text-[#5b4a3a] mb-2'>
                    Mật khẩu mới
                  </label>
                  <input
                    type='password'
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className='sahara-input w-full px-4 py-3'
                    placeholder='Mật khẩu mới'
                  />
                </div>
                <div>
                  <label className='block text-sm font-bold text-[#5b4a3a] mb-2'>
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type='password'
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className='sahara-input w-full px-4 py-3'
                    placeholder='Nhập lại mật khẩu'
                  />
                </div>
              </div>

              <div className='pt-4 flex justify-end'>
                <button
                  type='submit'
                  disabled={isChangingPwd}
                  className={`sahara-button px-6 py-3 ${
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
