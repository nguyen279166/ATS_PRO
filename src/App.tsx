import Sidebar from "./layouts/Sidebar";

export default function App() {
  return (
    // Mẹ ranh: flex bọc ngoài cùng sẽ tự xếp Sidebar bên trái và thẻ <main> lấp phần còn lại bên phải
    <div className='flex min-h-screen bg-slate-50'>
      <Sidebar />

      {/* flex-1 ép thẻ main mở rộng chiếm TOÀN BỘ khoảng trống còn lại bên tay phải */}
      <main className='flex-1 p-8'>
        {/* Đây chính là phần Header chung chứa Tiêu đề */}
        <header className='mb-8'>
          <h2 className='text-3xl font-bold text-slate-800 tracking-tight'>
            Job Listings
          </h2>
          <p className='text-slate-500 mt-1'>
            Quản lý và theo dõi các tin đăng tuyển dụng của tổ chức.
          </p>
        </header>

        {/* Nơi đây lát nữa chúng ta sẽ thả cái Kanban Board siêu bự vào 👇 */}
        <div className='border-4 border-dashed border-slate-200 rounded-2xl h-[600px] flex items-center justify-center bg-slate-100/50'>
          <p className='text-slate-400 font-medium'>
            Bảng Kanban Board sẽ xuất hiện ở góc này
          </p>
        </div>
      </main>
    </div>
  );
}
