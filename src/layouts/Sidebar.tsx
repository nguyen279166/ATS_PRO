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

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);

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
        const res = await axios.get("http://localhost:3001/api/auth/me", {
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
    <aside className='w-64 bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col min-h-screen sticky top-0'>
      {/* Logo */}
      <div className='p-6 pb-8'>
        <Link to='/' className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30'>
            <span className='font-black text-lg'>A</span>
          </div>
          <div>
            <h1 className='text-xl font-bold tracking-wide'>
              ATS<span className='text-blue-400'>PRO</span>
            </h1>
            <p className='text-[11px] text-slate-500 font-medium -mt-0.5'>
              Recruitment System
            </p>
          </div>
        </Link>
      </div>

      {/* Menu Label */}
      <p className='px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3'>
        Menu
      </p>

      {/* Navigation */}
      <nav className='flex-1 px-3'>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-300 rounded-r-full' />
                  )}
                  <Icon size={20} />
                  <span className='font-medium text-sm'>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className='p-4 m-3 mb-4 bg-white/5 rounded-2xl border border-white/10'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30'>
              <img
                src={profile?.avatar || "https://i.pravatar.cc/150?u=admin"}
                alt='User Avatar'
                className='w-10 h-10 rounded-full object-cover shadow-inner border-1 border-slate-50'
              />
            </div>
            <div>
              <p className='text-sm font-semibold'>
                {profile?.fullName?.split(" ").pop()}
              </p>
              <p className='text-xs text-slate-400 uppercase'>
                {profile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className='text-slate-400 hover:text-red-400 transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-lg'
            title='Đăng xuất'
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
