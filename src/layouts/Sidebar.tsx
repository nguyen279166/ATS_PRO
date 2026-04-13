import { LayoutDashboard, Briefcase, Users, Settings } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, active: false },
    { name: "Jobs", icon: Briefcase, active: true },
    { name: "Candidates", icon: Users, active: false },
    { name: "Settings", icon: Settings, active: false },
  ];
  return (
    // min-h-screen giúp Sidebar chạy dài tới tận mép dưới màn hình, w-64 cố định chiều rộng
    <aside className='w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col'>
      {/* Logo Component */}
      <div className='mb-8 px-4 mt-2'>
        <h1 className='text-2xl font-bold text-blue-500 tracking-wider'>
          ATS<span className='text-white'>PRO</span>
        </h1>
      </div>
      {/* Điểm nhấn: dùng flex-1 để đẩy các thành phần bên dưới xuống tận đáy (User Avatar) */}
      <nav className='flex-1'>
        <ul className='space-y-2'>
          {menuItems.map((item) => {
            const Icon = item.icon; // Lấy icon động từ mảng menuItems
            return (
              <li key={item.name}>
                <a
                  href='#'
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                    item.active
                      ? "bg-blue-600 text-white shadow-md" // Nếu active (Jobs) thì xanh lè
                      : "text-slate-400 hover:bg-slate-800 hover:text-white" // Không active thì xám
                  }`}
                >
                  <Icon size={20} />
                  <span className='font-medium'>{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Phần Đáy (User Info) */}
      <div className='mt-auto pt-6 px-4 border-t border-slate-800'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-slate-700 overflow-hidden'>
            <img src='https://i.pravatar.cc/150?u=admin' alt='User Avatar' />
          </div>
          <div>
            <p className='text-sm font-semibold'>Tuấn Nguyễn</p>
            <p className='text-xs text-slate-400'>HR Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
