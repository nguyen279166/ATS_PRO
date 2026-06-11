import { API_BASE_URL } from "../config/env";

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url) && !url.includes("/uploads/")) {
    return url;
  }

  const uploadsIndex = url.indexOf("/uploads/");
  const path = uploadsIndex >= 0 ? url.slice(uploadsIndex) : url;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getInitials(name?: string | null) {
  const words = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
