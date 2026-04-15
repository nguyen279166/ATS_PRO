import { mockJobs } from "../api/mockData";
import { MapPin, Building, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  // Chỉ hiển thị những Job đang mở
  const openJobs = mockJobs.filter((job) => job.status === "Open");

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      {/* NAVBAR */}
      <nav className='flex items-center justify-between px-8 py-5 max-w-6xl mx-auto'>
        <h1 className='text-2xl font-bold text-blue-600 tracking-wider'>
          ATS<span className='text-slate-800'>PRO</span>
        </h1>
        <div className='flex items-center gap-4'>
          <Link
            to='/login'
            className='text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors'
          >
            Đăng nhập
          </Link>
          <Link
            to='/register'
            className='text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm'
          >
            Đăng ký
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className='text-center max-w-3xl mx-auto px-6 py-20'>
        <div className='inline-flex items-center gap-2 bg-blue-50 text-blue-600 font-medium text-sm px-4 py-2 rounded-full mb-6'>
          <Sparkles size={16} /> Nền tảng tuyển dụng hàng đầu
        </div>
        <h2 className='text-5xl font-extrabold text-slate-900 leading-tight mb-6'>
          Tìm kiếm công việc <br />
          <span className='text-blue-600'>mơ ước của bạn</span>
        </h2>
        <p className='text-lg text-slate-500 max-w-xl mx-auto mb-10'>
          Kết nối hàng nghìn ứng viên tài năng với các cơ hội việc làm hấp dẫn
          tại những công ty hàng đầu.
        </p>
        <a
          href='#jobs'
          className='inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
        >
          Xem vị trí đang tuyển <ArrowRight size={18} />
        </a>
      </section>

      {/* STATS SECTION */}
      <section className='max-w-4xl mx-auto grid grid-cols-3 gap-8 px-6 pb-16'>
        {[
          { number: "500+", label: "Công ty đối tác" },
          { number: "10K+", label: "Ứng viên đã ứng tuyển" },
          { number: "95%", label: "Tỷ lệ hài lòng" },
        ].map((stat) => (
          <div key={stat.label} className='text-center'>
            <p className='text-4xl font-extrabold text-blue-600'>
              {stat.number}
            </p>
            <p className='text-slate-500 mt-1 font-medium'>{stat.label}</p>
          </div>
        ))}
      </section>

      {/* JOB LISTINGS */}
      <section id='jobs' className='max-w-5xl mx-auto px-6 pb-24'>
        <h3 className='text-3xl font-bold text-slate-900 text-center mb-3'>
          Vị trí đang tuyển
        </h3>
        <p className='text-slate-500 text-center mb-10'>
          Khám phá các cơ hội nghề nghiệp phù hợp với bạn
        </p>

        <div className='space-y-4'>
          {openJobs.map((job) => (
            <div
              key={job.id}
              className='bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors'>
                    {job.title}
                  </h4>
                  <div className='flex items-center gap-4 mt-2 text-sm text-slate-500'>
                    <span className='flex items-center gap-1'>
                      <Building size={14} /> {job.department}
                    </span>
                    <span className='flex items-center gap-1'>
                      <MapPin size={14} /> {job.location}
                    </span>
                  </div>
                </div>
                <button className='bg-blue-50 text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm flex items-center gap-2'>
                  Ứng tuyển ngay <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className='border-t border-slate-100 py-8 text-center text-sm text-slate-400'>
        <p>
          &copy; 2026 ATSPRO. Được xây dựng bởi{" "}
          <span className='font-semibold text-slate-600'>Tuấn Nguyễn</span> với
          React + TypeScript + Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}
