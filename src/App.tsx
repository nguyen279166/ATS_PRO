import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./hooks/useAuth";
import { DataProvider } from "./hooks/DataProvider";
import Sidebar from "./layouts/Sidebar";

const CandidateList = lazy(() => import("./pages/CandidateList"));
const JobList = lazy(() => import("./pages/JobList"));
const KanbanBoard = lazy(() => import("./pages/KanbanBoard"));
const Dashboard = lazy(() => import("./pages/DashBoard"));
const LoginForm = lazy(() => import("./pages/LoginForm"));
const RegisterForm = lazy(() => import("./pages/RegisterForm"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Settings = lazy(() => import("./pages/Settings"));

function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = (() => {
      if (pathname === "/") return "Tổng quan tuyển dụng";
      if (pathname === "/login") return "Đăng nhập";
      if (pathname === "/register") return "Đăng ký";
      if (pathname === "/forgot-password") return "Quên mật khẩu";
      if (pathname === "/reset-password") return "Đặt lại mật khẩu";
      if (pathname === "/careers") return "Cơ hội nghề nghiệp";
      if (pathname === "/jobs") return "Tin tuyển dụng";
      if (pathname.startsWith("/jobs/")) return "Pipeline ứng viên";
      if (pathname === "/candidates") return "Danh sách ứng viên";
      if (pathname === "/settings") return "Cài đặt tài khoản";
      return "Quản lý tuyển dụng";
    })();

    document.title = `${pageTitle} | ATS PRO`;
  }, [pathname]);

  return null;
}

function RouteLoader({
  children,
  fullPage = false,
}: {
  children: React.ReactNode;
  fullPage?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div
          role='status'
          aria-live='polite'
          className={`${fullPage ? "flex min-h-screen items-center justify-center px-4" : "sahara-card p-6"} text-sm font-bold text-[var(--color-text-muted)]`}
        >
          Đang tải nội dung…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Layout có Sidebar (chỉ dành cho người đã đăng nhập)
function LayoutCore({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isKanbanPage = location.pathname.startsWith("/jobs/");

  const pageMeta = (() => {
    if (location.pathname === "/") {
      return {
        index: "01",
        title: "Tổng quan tuyển dụng",
        description: "Theo dõi các chỉ số và hoạt động tuyển dụng quan trọng.",
      };
    }
    if (location.pathname === "/jobs") {
      return {
        index: "02",
        title: "Tin tuyển dụng",
        description: "Quản lý vị trí đang mở và pipeline của từng công việc.",
      };
    }
    if (location.pathname.startsWith("/jobs/")) {
      return {
        index: "02",
        title: "Pipeline ứng viên",
        description: "Theo dõi và cập nhật ứng viên qua từng giai đoạn.",
      };
    }
    if (location.pathname === "/candidates") {
      return {
        index: "03",
        title: "Danh sách ứng viên",
        description: "Tìm kiếm, lọc và quản lý hồ sơ ứng viên tập trung.",
      };
    }
    if (location.pathname === "/settings") {
      return {
        index: "04",
        title: "Cài đặt tài khoản",
        description: "Quản lý hồ sơ, bảo mật và tùy chọn hiển thị.",
      };
    }
    return {
      index: "00",
      title: "ATS Pro",
      description: "Không gian quản lý tuyển dụng của bạn.",
    };
  })();

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const routeHeading = isKanbanPage
        ? document.getElementById("kanban-page-title")
        : titleRef.current;
      routeHeading?.focus();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [isKanbanPage, location.pathname]);

  return (
    <div className='sahara-app-shell flex min-h-screen transition-colors duration-200'>
      <a href='#main-content' className='skip-link'>
        Bỏ qua điều hướng
      </a>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main
        id='main-content'
        className='sahara-main min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 xl:px-8 xl:py-8'
      >
        <div className='mx-auto flex w-full max-w-[1600px] flex-col'>
          {isKanbanPage ? (
            <div className='mb-3 flex min-h-11 items-center justify-between lg:hidden'>
              <button
                type='button'
                className='sahara-icon-button -ml-2 shrink-0'
                onClick={() => setIsSidebarOpen(true)}
                aria-label='Mở menu điều hướng'
                aria-expanded={isSidebarOpen}
              >
                <Menu size={22} aria-hidden='true' />
              </button>
              <p className='text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]'>
                ATS Pro / Pipeline
              </p>
            </div>
          ) : (
            <header className='mb-8 flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between'>
              <div className='flex min-w-0 items-start gap-3 sm:gap-4'>
                <button
                  type='button'
                  className='sahara-icon-button -ml-2 shrink-0 lg:hidden'
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label='Mở menu điều hướng'
                  aria-expanded={isSidebarOpen}
                >
                  <Menu size={22} aria-hidden='true' />
                </button>
                <div className='min-w-0'>
                  <p className='mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]'>
                    {pageMeta.index} / Vận hành ATS
                  </p>
                  <h1
                    ref={titleRef}
                    tabIndex={-1}
                    className='sahara-page-title text-[2rem] font-black focus:outline-none sm:text-[2.65rem]'
                  >
                    {pageMeta.title}
                  </h1>
                  <p className='mt-2 max-w-2xl text-sm font-medium text-[var(--color-text-muted)] sm:text-[0.95rem]'>
                    {pageMeta.description}
                  </p>
                </div>
              </div>
              <div className='hidden shrink-0 text-right md:block'>
                <p className='text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]'>
                  Trạng thái hệ thống
                </p>
                <p className='mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--color-text)]'>
                  <span
                    className='h-2.5 w-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-secondary)_14%,transparent)]'
                    aria-hidden='true'
                  />
                  Hệ thống sẵn sàng
                </p>
              </div>
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to='/login' replace />;
  }

  return <LayoutCore>{children}</LayoutCore>;
}

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <BrowserRouter>
      <RouteMetadata />
      <DataProvider>
        <Routes>
          <Route
            path='/login'
            element={
              isLoggedIn ? (
                <Navigate to='/' replace />
              ) : (
                <RouteLoader fullPage>
                  <LoginForm />
                </RouteLoader>
              )
            }
          />
          <Route
            path='/register'
            element={
              isLoggedIn ? (
                <Navigate to='/' replace />
              ) : (
                <RouteLoader fullPage>
                  <RegisterForm />
                </RouteLoader>
              )
            }
          />
          <Route
            path='/forgot-password'
            element={
              isLoggedIn ? (
                <Navigate to='/' replace />
              ) : (
                <RouteLoader fullPage>
                  <ForgotPassword />
                </RouteLoader>
              )
            }
          />
          <Route
            path='/reset-password'
            element={
              isLoggedIn ? (
                <Navigate to='/' replace />
              ) : (
                <RouteLoader fullPage>
                  <ResetPassword />
                </RouteLoader>
              )
            }
          />

          <Route
            path='/'
            element={
              isLoggedIn ? (
                <ProtectedRoute>
                  <RouteLoader>
                    <Dashboard />
                  </RouteLoader>
                </ProtectedRoute>
              ) : (
                <RouteLoader fullPage>
                  <LandingPage />
                </RouteLoader>
              )
            }
          />

          <Route
            path='/jobs'
            element={
              <ProtectedRoute>
                <RouteLoader>
                  <JobList />
                </RouteLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path='/jobs/:jobId'
            element={
              <ProtectedRoute>
                <RouteLoader>
                  <KanbanBoard />
                </RouteLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path='/careers'
            element={
              <RouteLoader fullPage>
                <LandingPage />
              </RouteLoader>
            }
          />
          <Route
            path='/candidates'
            element={
              <ProtectedRoute>
                <RouteLoader>
                  <CandidateList />
                </RouteLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute>
                <RouteLoader>
                  <Settings />
                </RouteLoader>
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>

        <ToastContainer position='bottom-right' />
      </DataProvider>
    </BrowserRouter>
  );
}
