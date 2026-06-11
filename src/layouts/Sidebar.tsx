import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import Avatar from "../components/Avatar";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<{ fullName: string; role: string; avatar?: string } | null>(null);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Jobs", icon: Briefcase, path: "/jobs" },
    { name: "Candidates", icon: Users, path: "/candidates" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

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

  return (
    <aside className='sahara-sidebar sticky top-0 flex h-screen max-h-screen w-56 shrink-0 flex-col overflow-hidden text-white'>
      {/* Logo */}
      <div className='shrink-0 p-5 pb-5'>
        <Link to='/' className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-[#fff7eb]/90 text-[#8a4518] rounded-lg flex items-center justify-center shadow-sm'>
            <span className='font-black text-base'>A</span>
          </div>
          <div>
            <h1 className='text-xl font-bold tracking-wide'>
              ATS<span className='text-[#fff1d8]'> PRO</span>
            </h1>
            <p className='text-[11px] text-[#f4dec3] font-medium -mt-0.5'>
              Recruitment System
            </p>
          </div>
        </Link>
      </div>

      {/* Menu Label */}
      <p className='shrink-0 px-5 text-[11px] font-bold text-[#f3dcc0]/80 uppercase tracking-widest mb-3'>
        Menu
      </p>

      {/* Navigation */}
      <nav className='min-h-0 flex-1 overflow-y-auto px-3 pb-3'>
        <ul className='space-y-1'>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/jobs" && location.pathname.startsWith("/jobs/"));

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? "bg-[#8f5c38] text-white shadow-sm"
                      : "text-[#fff8ed]/80 hover:bg-[#fff8ed]/12 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#fff1d8] rounded-r-full' />
                  )}
                  <Icon size={17} />
                  <span className='font-medium text-sm'>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className='m-3 mt-auto shrink-0 rounded-lg border border-[#fff8ed]/18 bg-[#fff8ed]/12 p-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Avatar
              name={profile?.fullName}
              src={profile?.avatar}
              className='h-9 w-9 text-xs shadow-inner ring-2 ring-[#fff1d8]/35'
              imageClassName='border border-[#fff1d8]'
            />
            <div>
              <p className='text-sm font-semibold'>
                {profile?.fullName?.split(" ").pop()}
              </p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mt-0.5 ${
                profile?.role === "admin"
                  ? "bg-[#fff1d8]/20 text-[#fff1d8]"
                  : "bg-[#6f7f5a]/30 text-[#f3dcc0]"
              }`}>
                {profile?.role === "admin" ? "⚡ Admin" : "HR"}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className='text-[#fff8ed]/75 hover:text-white transition-colors cursor-pointer p-2 hover:bg-[#fff8ed]/10 rounded-lg'
            title='Đăng xuất'
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
