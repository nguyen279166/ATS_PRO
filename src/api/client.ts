import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const AUTH_TOKEN_KEY = "token_lay_duoc";
export const USER_ROLE_KEY = "user_role";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/forgot-password") ||
      url.includes("/api/auth/reset-password");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export const isApiError = axios.isAxiosError;
