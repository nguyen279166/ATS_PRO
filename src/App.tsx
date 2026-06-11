import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./layouts/Sidebar";
import CandidateList from "./pages/CandidateList";
import JobList from "./pages/JobList";
import KanbanBoard from "./pages/KanbanBoard";
import Dashboard from "./pages/DashBoard";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./pages/LandingPage";

// Layout có Sidebar (chỉ dành cho người đã đăng nhập)
function LayoutCore({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const pageTitle = (() => {
    if (location.pathname === "/") return "Dashboard Overview";
    if (location.pathname === "/jobs") return "Job Openings";
    if (location.pathname.startsWith("/jobs/")) return "Kanban Board";
    if (location.pathname === "/candidates") return "Candidates Directory";
    if (location.pathname === "/settings") return "Settings & Profile";
    return "Application Tracking System";
  })();

  return (
    <div className='sahara-app-shell flex min-h-screen transition-colors duration-200'>
      <Sidebar />
      <main className='sahara-main flex-1 p-7 flex flex-col'>
        <header className='mb-6 flex items-end justify-between gap-4'>
          <div>
            <p className='text-[11px] font-bold uppercase text-[#9a7655]'>
            ATS PRO
            </p>
            <h2 className='sahara-page-title text-3xl font-black tracking-tight'>
            {pageTitle}
            </h2>
            <p className='text-[#7d6f62] mt-1 text-sm'>
            Quản lý và theo dõi các luồng công việc tuyển dụng của bạn.
          </p>
          </div>
          <div className='hidden md:flex items-center gap-2 rounded-lg border border-[#d8c8b5] bg-[#fffaf2]/70 px-3 py-2 text-xs font-bold text-[#7d6f62]'>
            <span className='h-2 w-2 rounded-full bg-[#6f7f5a]' />
            Sahara workspace
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

// Component "Bảo vệ cửa": Chặn người lạ, chỉ cho người có token đi qua
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  // Nếu chưa đăng nhập → Đá ngược về trang Login
  if (!isLoggedIn) {
    return <Navigate to='/login' replace />;
  }

  // Nếu đã đăng nhập → Cho qua cửa bình thường
  return <LayoutCore>{children}</LayoutCore>;
}

import { DataProvider } from "./hooks/DataProvider";
import Settings from "./pages/Settings";

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          {/* TRANG CÔNG KHAI: Ai cũng vào được */}
          <Route
            path='/login'
            element={
              // Nếu đã login rồi mà vào /login thì đá về trang chủ luôn
              isLoggedIn ? <Navigate to='/' replace /> : <LoginForm />
            }
          />
          <Route
            path='/register'
            element={isLoggedIn ? <Navigate to='/' replace /> : <RegisterForm />}
          />
          <Route
            path='/forgot-password'
            element={
              isLoggedIn ? <Navigate to='/' replace /> : <ForgotPassword />
            }
          />
          <Route
            path='/reset-password'
            element={
              isLoggedIn ? <Navigate to='/' replace /> : <ResetPassword />
            }
          />

          {/* TRANG BẢO VỆ: Phải có token mới vào được */}
          <Route
            path='/'
            element={
              isLoggedIn ? (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <LandingPage />
              )
            }
          />

          <Route
            path='/jobs'
            element={
              <ProtectedRoute>
                <JobList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/jobs/:jobId'
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />
          <Route path='/careers' element={<LandingPage />} />
          <Route
            path='/candidates'
            element={
              <ProtectedRoute>
                <CandidateList />
              </ProtectedRoute>
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>

        <ToastContainer position='bottom-right' />
      </DataProvider>
    </BrowserRouter>
  );
}
