import axios from "axios";
import { API_BASE_URL } from "../../config/env";
import type { SettingsProfile } from "./types";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token_lay_duoc")}`,
});

export const fetchSettingsProfile = () =>
  axios.get<SettingsProfile>(`${API_BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

export const changeSettingsPassword = (
  currentPassword: string,
  newPassword: string,
) =>
  axios.put(
    `${API_BASE_URL}/api/auth/password`,
    { currentPassword, newPassword },
    { headers: getAuthHeaders() },
  );

export const uploadSettingsAvatar = (formData: FormData) =>
  axios.post<{ avatarUrl: string }>(
    `${API_BASE_URL}/api/auth/upload`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    },
  );
