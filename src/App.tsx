import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./layouts/Sidebar";
import JobList from "./pages/JobList";

// Một Layout Wrapper (Bề mặt chung) để chứa cái Sidebar cố định
function LayoutCore({ children }: { children: React.ReactNode }) {
  const location = useLocation(); // Hook này giúp đọc xem URL trên trình duyệt đang ở đâu

  // Tự động rà soát đường dẫn để đặt lại tên Header cho đúng
  const pageTitle =
    location.pathname === "/jobs"
      ? "Job Listings"
      : location.pathname === "/"
        ? "Dashboard Overview"
        : "Application Tracking System";

  return (
    <div className='flex min-h-screen bg-slate-50'>
      <Sidebar />
      <main className='flex-1 p-8'>
        <header className='mb-8'>
          <h2 className='text-3xl font-bold text-slate-800 tracking-tight'>
            {pageTitle}
          </h2>
          <p className='text-slate-500 mt-1'>
            Quản lý và theo dõi các luồng công việc tuyển dụng của bạn.
          </p>
        </header>
        {/* Cửa sổ thần kỳ: Component con sẽ tự thay đổi ở cái nắp cống {children} này */}
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    // Biến trang Web thành hệ thống điều hướng (Router)
    <BrowserRouter>
      <LayoutCore>
        <Routes>
          {/* Default Route: Tạm thời cho cái rỗng */}
          <Route
            path='/'
            element={
              <div className='p-8 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100 border-dashed'>
                <h3 className='text-xl font-bold mb-2'>
                  Màn hình tĩnh Dashboard
                </h3>
              </div>
            }
          />
          <Route path='/jobs' element={<JobList />} />
        </Routes>
      </LayoutCore>
    </BrowserRouter>
  );
}
