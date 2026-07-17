import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { useDarkMode } from "../../hooks/useDarkMode";
import {
  changeSettingsPassword,
  fetchSettingsProfile,
  uploadSettingsAvatar,
} from "./api";
import type {
  PasswordError,
  PasswordField,
  PasswordValues,
  SettingsProfile,
} from "./types";

const EMPTY_PASSWORD_VALUES: PasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const useSettings = () => {
  const { logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordValues, setPasswordValues] = useState<PasswordValues>(
    EMPTY_PASSWORD_VALUES,
  );
  const [passwordError, setPasswordError] =
    useState<PasswordError | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(
    () => localStorage.getItem("emailNotif") !== "false",
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setProfileError(null);
    try {
      const response = await fetchSettingsProfile();
      setProfile(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      setProfileError(
        "Không thể tải thông tin tài khoản. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updatePasswordValue = useCallback(
    (field: PasswordField, value: string) => {
      setPasswordValues((previous) => ({ ...previous, [field]: value }));
      setPasswordStatus(null);
      setPasswordError((previous) =>
        previous?.field === field ? null : previous,
      );
    },
    [],
  );

  const handleChangePassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPasswordError(null);
      setPasswordStatus(null);

      if (passwordValues.newPassword !== passwordValues.confirmPassword) {
        const message = "Mật khẩu mới không khớp!";
        setPasswordError({ field: "confirmPassword", message });
        toast.error(message);
        return;
      }
      if (passwordValues.newPassword.length < 8) {
        const message = "Mật khẩu mới phải có ít nhất 8 ký tự!";
        setPasswordError({ field: "newPassword", message });
        toast.error(message);
        return;
      }

      setIsChangingPassword(true);
      try {
        await changeSettingsPassword(
          passwordValues.currentPassword,
          passwordValues.newPassword,
        );
        toast.success("Đổi mật khẩu thành công!");
        setPasswordValues(EMPTY_PASSWORD_VALUES);
        setPasswordStatus("Mật khẩu của bạn đã được cập nhật.");
      } catch (error: unknown) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.error || "Lỗi khi đổi mật khẩu"
          : "Lỗi khi đổi mật khẩu";
        setPasswordError({ field: "currentPassword", message });
        toast.error(message);
      } finally {
        setIsChangingPassword(false);
      }
    },
    [passwordValues],
  );

  const handleAvatarUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;

      setUploadError(null);
      setUploadStatus(null);
      if (file.size > MAX_AVATAR_SIZE) {
        const message = "File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.";
        setUploadError(message);
        toast.error(message);
        input.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);
      setIsUploading(true);
      try {
        const response = await uploadSettingsAvatar(formData);
        setProfile((currentProfile) =>
          currentProfile
            ? { ...currentProfile, avatar: response.data.avatarUrl }
            : currentProfile,
        );
        setUploadStatus("Ảnh đại diện đã được cập nhật.");
        toast.success("Cập nhật ảnh đại diện thành công!");
      } catch (error: unknown) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.error || "Lỗi khi tải ảnh lên"
          : "Lỗi khi tải ảnh lên";
        setUploadError(message);
        toast.error(message);
      } finally {
        setIsUploading(false);
        input.value = "";
      }
    },
    [],
  );

  const toggleEmailNotifications = useCallback(() => {
    setEmailNotifications((previous) => {
      const next = !previous;
      localStorage.setItem("emailNotif", next.toString());
      return next;
    });
  }, []);

  return {
    profile,
    loading,
    profileError,
    loadProfile,
    passwordValues,
    passwordError,
    passwordStatus,
    isChangingPassword,
    updatePasswordValue,
    handleChangePassword,
    isUploading,
    uploadError,
    uploadStatus,
    handleAvatarUpload,
    emailNotifications,
    toggleEmailNotifications,
    isDark,
    toggleDarkMode,
    logout,
  };
};
