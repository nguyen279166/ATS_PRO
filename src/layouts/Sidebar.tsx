import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import Avatar from "../components/Avatar";
import BrandMark from "../components/BrandMark";

const menuItems = [
  { name: "Tổng quan", icon: LayoutDashboard, path: "/" },
  { name: "Tin tuyển dụng", icon: Briefcase, path: "/jobs" },
  { name: "Ứng viên", icon: Users, path: "/candidates" },
  { name: "Cài đặt", icon: Settings, path: "/settings" },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<{
    fullName: string;
    role: string;
    avatar?: string;
  } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 1024px)").matches,
  );
  const isSidebarAvailable = isDesktop || isOpen;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token_lay_duoc");
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncViewport = () => setIsDesktop(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (isDesktop && isOpen) onClose();
  }, [isDesktop, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const sidebar = sidebarRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sidebar) return;

      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [isDesktop, isOpen, onClose]);

  return (
    <>
      {isOpen && !isDesktop && (
        <button
          type='button'
          className='fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden'
          onClick={onClose}
          tabIndex={-1}
          aria-hidden='true'
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sahara-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[264px] shrink-0 flex-col overflow-hidden text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label='Điều hướng chính'
        aria-hidden={!isSidebarAvailable}
        inert={isSidebarAvailable ? undefined : true}
      >
        {/* Logo */}
        <div className='flex shrink-0 items-center justify-between gap-2 px-5 pb-7 pt-6'>
          <Link to='/' className='flex min-h-11 items-center gap-3.5' onClick={onClose}>
            <div className='brand-mark-tile flex h-11 w-11 items-center justify-center rounded-2xl'>
              <BrandMark className='h-8 w-8' />
            </div>
            <div>
              <p className='text-[1.15rem] font-black tracking-[-0.02em]'>
                ATS<span className='text-[var(--color-sidebar-accent)]'> / PRO</span>
              </p>
              <p className='mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-sidebar-muted)]'>
                Vận hành tuyển dụng
              </p>
            </div>
          </Link>
          <button
            ref={closeButtonRef}
            type='button'
            className='inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-sidebar-text)] hover:bg-white/10 lg:hidden'
            onClick={onClose}
            aria-label='Đóng menu điều hướng'
          >
            <X size={20} aria-hidden='true' />
          </button>
        </div>

        <p className='mb-3 shrink-0 px-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-sidebar-muted)]'>
          Không gian
        </p>

        <nav className='min-h-0 flex-1 overflow-y-auto px-3 pb-3'>
          <ul className='space-y-1.5'>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === "/jobs" &&
                  location.pathname.startsWith("/jobs/"));

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex min-h-12 cursor-pointer items-center gap-3.5 rounded-xl px-3.5 py-3 transition-[background-color,color,transform,box-shadow] duration-200 ${
                      isActive
                        ? "bg-[var(--color-sidebar-active)] text-[#191a1d] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                        : "text-[var(--color-sidebar-muted)] hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span
                        className='absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_4px_rgba(199,70,22,0.12)]'
                        aria-hidden='true'
                      />
                    )}
                    <Icon size={19} strokeWidth={2} aria-hidden='true' />
                    <span className='text-sm font-bold'>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className='m-3 mt-auto shrink-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex min-w-0 items-center gap-3'>
              <Avatar
                name={profile?.fullName}
                src={profile?.avatar}
                className='h-10 w-10 shrink-0 text-xs shadow-inner ring-2 ring-[var(--color-sidebar-accent)]/30'
                imageClassName='border border-[var(--color-sidebar-accent)]'
              />
              <div className='min-w-0'>
                <p className='truncate text-sm font-bold'>
                  {profile?.fullName?.split(" ").filter(Boolean).pop() ||
                    "Tài khoản"}
                </p>
                <span className='mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-sidebar-accent)]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--color-sidebar-accent)]'>
                  {profile?.role === "admin" && (
                    <ShieldCheck size={11} aria-hidden='true' />
                  )}
                  {profile?.role === "admin" ? "Admin" : "HR"}
                </span>
              </div>
            </div>
            <button
              type='button'
              onClick={() => logout()}
              className='inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--color-sidebar-text)] transition-colors hover:bg-white/10 hover:text-white'
              title='Đăng xuất'
              aria-label='Đăng xuất'
            >
              <LogOut size={18} aria-hidden='true' />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
