import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPin, Building, ArrowRight, Sparkles, Upload, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Job } from "../types";

export default function LandingPage() {
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPublicJobs = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/public/jobs");
        setOpenJobs(res.data);
      } catch (error) {
        console.error("Lỗi khi tải công việc:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicJobs();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsApplying(true);
    const baseUrl = import.meta.env.VITE_BASE_URL;
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJob.id);
      formData.append("name", applicantName);
      formData.append("email", applicantEmail);
      if (cvFile) formData.append("cv", cvFile);

      await axios.post(`${baseUrl}/api/public/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ với bạn.");
      setSelectedJob(null);
      setApplicantName("");
      setApplicantEmail("");
      setCvFile(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Lỗi khi ứng tuyển");
      } else {
        toast.error("Lỗi khi ứng tuyển");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext || "")) {
      toast.error("Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn, tối đa 10MB");
      return;
    }
    setCvFile(file);
  };

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
          {loading ? (
            <div className='text-center py-10 text-slate-500'>
              Đang tải danh sách công việc...
            </div>
          ) : openJobs.length === 0 ? (
            <div className='text-center py-10 text-slate-500'>
              Hiện tại chưa có vị trí nào đang mở. Vui lòng quay lại sau!
            </div>
          ) : (
            openJobs.map((job) => (
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
                      <span className='flex items-center gap-1 ml-4 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold'>
                        Bởi {job.user?.fullName}
                      </span>
                    </div>
                    {job.description && (
                      <p className='mt-4 text-slate-600 text-sm line-clamp-2 whitespace-pre-wrap'>
                        {job.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className='bg-blue-50 text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm flex items-center gap-2'
                  >
                    Ứng tuyển ngay <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className='border-t border-slate-100 py-8 text-center text-sm text-slate-400'>
        <p>
          &copy; 2026 ATSPRO. Được xây dựng bởi{" "}
          <span className='font-semibold text-slate-600'>
            <a href='https://web.facebook.com/chungnguyen.nguyen.9028'>
              Nguyên Chung Nguyên
            </a>
          </span>{" "}
          với React + TypeScript + Tailwind CSS.
        </p>
      </footer>
      {/* APPLY MODAL */}
      {selectedJob && (
        <div className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col'>
            <div className='p-6 border-b border-slate-100 flex-shrink-0'>
              <h3 className='text-xl font-bold text-slate-800'>
                Ứng tuyển vị trí
              </h3>
              <p className='text-blue-600 font-semibold mt-1'>
                {selectedJob.title}
              </p>
            </div>

            <div className='flex-1 overflow-y-auto p-6 space-y-6'>
              {selectedJob.description && (
                <div>
                  <h4 className='text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider'>
                    Mô tả công việc (JD)
                  </h4>
                  <div className='bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed border border-slate-100'>
                    {selectedJob.description}
                  </div>
                </div>
              )}

              <form onSubmit={handleApply} className='space-y-4'>
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-1'>
                    Họ và Tên
                  </label>
                  <input
                    type='text'
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700'
                    placeholder='Nguyễn Văn A'
                  />
                </div>
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-1'>
                    Email liên hệ
                  </label>
                  <input
                    type='email'
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700'
                    placeholder='nguyenvana@gmail.com'
                  />
                </div>

                  {/* CV Upload */}
                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-1'>
                      CV / Hồ sơ <span className='font-normal text-slate-400'>(không bắt buộc)</span>
                    </label>
                    {cvFile ? (
                      <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl'>
                        <FileText size={18} className='text-blue-600 flex-shrink-0' />
                        <span className='text-sm font-medium text-slate-700 flex-1 truncate'>{cvFile.name}</span>
                        <button type='button' onClick={() => { setCvFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className='text-slate-400 hover:text-red-500 transition-colors'>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button type='button' onClick={() => fileInputRef.current?.click()}
                        className='w-full flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group'>
                        <Upload size={18} className='text-slate-400 group-hover:text-blue-500' />
                        <span className='text-sm text-slate-500 group-hover:text-blue-600'>Tải lên CV của bạn</span>
                        <span className='text-xs text-slate-400 ml-auto'>PDF, DOC, JPG · 10MB</span>
                      </button>
                    )}
                    <input ref={fileInputRef} type='file' accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                      className='hidden' onChange={handleFileChange} />
                  </div>

                  <div className='pt-4 flex gap-3'>
                  <button
                    type='button'
                    onClick={() => setSelectedJob(null)}
                    className='flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors'
                  >
                    Hủy
                  </button>
                  <button
                    type='submit'
                    disabled={isApplying}
                    className={`flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors ${
                      isApplying ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isApplying ? "Đang gửi..." : "Gửi CV"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
