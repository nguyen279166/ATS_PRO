import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./hooks/AuthProvider";

// Khởi tạo trạng thái Dark Mode ngay trước khi React load để tránh lỗi mất Dark Mode ở các trang
if (localStorage.getItem("darkMode") === "true") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
