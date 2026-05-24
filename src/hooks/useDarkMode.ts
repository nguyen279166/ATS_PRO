import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Lấy trạng thái lưu trong localStorage
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  useEffect(() => {
    // Khi isDark thay đổi, cập nhật class trên thẻ <html> và lưu vào localStorage
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  return { isDark, toggleDarkMode };
}
