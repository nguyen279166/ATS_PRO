import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./hooks/AuthProvider";
import Sidebar from "./layouts/Sidebar";
import JobList from "./pages/JobList";
import KanbanBoard from "./pages/KanbanBoard";
import Dashboard from "./pages/DashBoard";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./pages/LandingPage";

// Layout có Sidebar (chỉ dành cho người đã đăng nhập)
function LayoutCore({ children }: { children: React.ReactNode }) {
  const location = useLocation();

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
        {children}
      </main>
    </div>
  );
}

// Component "Bảo vệ cửa": Chặn người lạ, chỉ cho người có token đi qua
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useContext(AuthContext);

  // Nếu chưa đăng nhập → Đá ngược về trang Login
  if (!isLoggedIn) {
    return <Navigate to='/login' replace />;
  }

  // Nếu đã đăng nhập → Cho qua cửa bình thường
  return <LayoutCore>{children}</LayoutCore>;
}

export default function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <BrowserRouter>
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
          path='/jobs'
          element={
            <ProtectedRoute>
              <JobList />
            </ProtectedRoute>
          }
        />
        <Route
          path='/candidates'
          element={
            <ProtectedRoute>
              <h1>Candidates</h1>
            </ProtectedRoute>
          }
        />
        <Route
          path='/settings'
          element={
            <ProtectedRoute>
              <h1>Settings</h1>
            </ProtectedRoute>
          }
        />
      </Routes>

      <ToastContainer position='bottom-right' />
    </BrowserRouter>
  );
}
