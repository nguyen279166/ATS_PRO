import axios from "axios";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building,
  FileText,
  MapPin,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/env";
import type { Job } from "../types";

export default function LandingPage() {
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPublicJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/public/jobs`);
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
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJob.id);
      formData.append("name", applicantName);
      formData.append("email", applicantEmail);
      if (cvFile) formData.append("cv", cvFile);

      await axios.post(`${API_BASE_URL}/api/public/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        "Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ với bạn.",
      );
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
    <main className='sahara-public-shell min-h-screen text-[var(--sahara-text)]'>
      <nav className='mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8'>
        <Link to='/' className='flex items-center gap-3'>
          <span className='flex h-11 w-11 items-center justify-center rounded-lg bg-[#3a302a] text-lg font-black text-[#f4b266] shadow-sm'>
            A
          </span>
          <div>
            <p className='text-xl font-black tracking-normal'>ATS PRO</p>
            <p className='text-[11px] font-bold text-[var(--sahara-muted)]'>
              Recruitment System
            </p>
          </div>
        </Link>
        <div className='flex items-center gap-3'>
          <Link
            to='/login'
            className='text-sm font-bold text-[var(--sahara-muted)] transition-colors hover:text-[var(--sahara-primary)]'
          >
            Đăng nhập
          </Link>
          <Link to='/register' className='sahara-button px-4 py-2 text-sm'>
            Đăng ký
          </Link>
        </div>
      </nav>

      <section className='mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16'>
        <div>
          <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8c8b5] bg-[#fffaf2]/78 px-4 py-2 text-sm font-bold text-[var(--sahara-primary)]'>
            <Sparkles size={16} /> Sahara hiring workspace
          </div>
          <h1 className='max-w-3xl text-5xl font-black leading-[1.05] tracking-normal sm:text-6xl'>
            ATS PRO Careers
          </h1>
          <p className='mt-5 max-w-2xl text-lg leading-8 text-[var(--sahara-muted)]'>
            Khám phá các vị trí đang mở và gửi CV trực tiếp vào pipeline tuyển
            dụng của ATS PRO.
          </p>
          <div className='mt-8 flex flex-wrap items-center gap-3'>
            <a href='#jobs' className='sahara-button px-5 py-3'>
              Xem vị trí đang tuyển <ArrowRight size={18} />
            </a>
            <Link to='/login' className='sahara-button-secondary px-5 py-3'>
              Vào workspace
            </Link>
          </div>
        </div>

        <div className='rounded-lg border border-[#d8c8b5] bg-[#fffaf2]/82 p-5 shadow-[var(--sahara-shadow)]'>
          <div className='mb-5 flex items-center justify-between'>
            <div>
              <p className='text-xs font-black uppercase text-[var(--sahara-primary)]'>
                Open roles
              </p>
              <h2 className='mt-1 text-2xl font-black tracking-normal'>
                Tuyển dụng hôm nay
              </h2>
            </div>
            <div className='rounded-lg border border-[#ddb778] bg-[#f4dfbd]/80 p-3 text-[var(--sahara-primary)]'>
              <BriefcaseBusiness size={22} />
            </div>
          </div>
          <div className='grid gap-3'>
            {[
              { label: "Vị trí đang mở", value: openJobs.length || 0 },
              { label: "Ứng viên đã nhận", value: "10K+" },
              { label: "Đội ngũ HR", value: "24/7" },
            ].map((stat) => (
              <div
                key={stat.label}
                className='flex items-center justify-between border-b border-[#d8c8b5]/70 py-3 last:border-b-0'
              >
                <span className='text-sm font-bold text-[var(--sahara-muted)]'>
                  {stat.label}
                </span>
                <span className='text-2xl font-black text-[var(--sahara-primary)]'>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='jobs' className='mx-auto max-w-6xl px-5 pb-20 sm:px-8'>
        <div className='mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
          <div>
            <p className='text-sm font-black uppercase text-[var(--sahara-primary)]'>
              Careers
            </p>
            <h2 className='mt-1 text-3xl font-black tracking-normal'>
              Vị trí đang tuyển
            </h2>
          </div>
          <div className='inline-flex w-fit items-center gap-2 rounded-lg border border-[#d8c8b5] bg-[#fffaf2]/72 px-3 py-2 text-sm font-bold text-[var(--sahara-muted)]'>
            <Users size={16} /> Ứng tuyển trong vài phút
          </div>
        </div>

        <div className='space-y-4'>
          {loading ? (
            <div className='sahara-card p-8 text-center text-[var(--sahara-muted)]'>
              Đang tải danh sách công việc...
            </div>
          ) : openJobs.length === 0 ? (
            <div className='sahara-card p-8 text-center text-[var(--sahara-muted)]'>
              Hiện tại chưa có vị trí nào đang mở. Vui lòng quay lại sau!
            </div>
          ) : (
            openJobs.map((job) => (
              <article
                key={job.id}
                className='sahara-card group p-5 transition-transform duration-200 hover:-translate-y-0.5'
              >
                <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <h3 className='text-xl font-black tracking-normal text-[var(--sahara-text)] transition-colors group-hover:text-[var(--sahara-primary)]'>
                      {job.title}
                    </h3>
                    <div className='mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[var(--sahara-muted)]'>
                      <span className='flex items-center gap-1.5'>
                        <Building size={15} /> {job.department}
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <MapPin size={15} /> {job.location}
                      </span>
                      <span className='rounded-lg bg-[#f4dfbd]/78 px-2.5 py-1 text-xs font-black text-[#8a4518]'>
                        Bởi {job.user?.fullName}
                      </span>
                    </div>
                    {job.description && (
                      <p className='mt-4 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[var(--sahara-muted)]'>
                        {job.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className='sahara-button min-h-11 shrink-0 px-5 py-2.5 text-sm'
                  >
                    Ứng tuyển ngay <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className='border-t border-[#d8c8b5]/72 bg-[#fffaf2]/50 px-5 py-8 text-center text-sm font-medium text-[var(--sahara-muted)]'>
        <p>
          &copy; 2026 ATS PRO. Xây dựng bởi{" "}
          <a
            className='font-black text-[var(--sahara-primary)] transition-colors hover:text-[var(--sahara-primary-dark)]'
            href='https://web.facebook.com/chungnguyen.nguyen.9028'
          >
            Nguyễn Chung Nguyên
          </a>
          .
        </p>
      </footer>

      {selectedJob && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#181413]/58 p-4 backdrop-blur-sm'>
          <div className='sahara-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden'>
            <div className='flex shrink-0 items-start justify-between gap-4 border-b border-[#d8c8b5] p-6'>
              <div>
                <h3 className='text-2xl font-black tracking-normal'>
                  Ứng tuyển vị trí
                </h3>
                <p className='mt-1 font-black text-[var(--sahara-primary)]'>
                  {selectedJob.title}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedJob(null)}
                className='rounded-lg p-2 text-[var(--sahara-muted)] transition-colors hover:bg-[#f4dfbd] hover:text-[var(--sahara-text)]'
              >
                <X size={20} />
              </button>
            </div>

            <div className='flex-1 space-y-6 overflow-y-auto p-6'>
              {selectedJob.description && (
                <div>
                  <h4 className='mb-2 text-sm font-black uppercase tracking-normal text-[var(--sahara-text)]'>
                    Mô tả công việc
                  </h4>
                  <div className='rounded-lg border border-[#d8c8b5] bg-[#f6efe4]/72 p-4 text-sm leading-6 text-[var(--sahara-muted)]'>
                    {selectedJob.description}
                  </div>
                </div>
              )}

              <form onSubmit={handleApply} className='space-y-4'>
                <div>
                  <label className='mb-1.5 block text-sm font-black'>
                    Họ và tên
                  </label>
                  <input
                    type='text'
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className='sahara-input h-11 w-full px-3 text-sm'
                    placeholder='Nguyễn Văn A'
                  />
                </div>
                <div>
                  <label className='mb-1.5 block text-sm font-black'>
                    Email liên hệ
                  </label>
                  <input
                    type='email'
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className='sahara-input h-11 w-full px-3 text-sm'
                    placeholder='nguyenvana@gmail.com'
                  />
                </div>

                <div>
                  <label className='mb-1.5 block text-sm font-black'>
                    CV / Hồ sơ{" "}
                    <span className='font-medium text-[var(--sahara-muted)]'>
                      (không bắt buộc)
                    </span>
                  </label>
                  {cvFile ? (
                    <div className='flex items-center gap-3 rounded-lg border border-[#ddb778] bg-[#f4dfbd]/72 p-3'>
                      <FileText
                        size={18}
                        className='shrink-0 text-[var(--sahara-primary)]'
                      />
                      <span className='min-w-0 flex-1 truncate text-sm font-bold text-[var(--sahara-text)]'>
                        {cvFile.name}
                      </span>
                      <button
                        type='button'
                        onClick={() => {
                          setCvFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className='text-[var(--sahara-muted)] transition-colors hover:text-[#9a452a]'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      className='flex min-h-14 w-full items-center gap-3 rounded-lg border-2 border-dashed border-[#d8c8b5] p-3 text-left transition-colors hover:border-[var(--sahara-primary)] hover:bg-[#f4dfbd]/50'
                    >
                      <Upload
                        size={18}
                        className='shrink-0 text-[var(--sahara-muted)]'
                      />
                      <span className='text-sm font-bold text-[var(--sahara-muted)]'>
                        Tải lên CV của bạn
                      </span>
                      <span className='ml-auto text-xs font-bold text-[var(--sahara-muted)]'>
                        PDF, DOC, JPG · 10MB
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                    className='hidden'
                    onChange={handleFileChange}
                  />
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => setSelectedJob(null)}
                    className='sahara-button-secondary h-11 flex-1'
                  >
                    Hủy
                  </button>
                  <button
                    type='submit'
                    disabled={isApplying}
                    className='sahara-button h-11 flex-1 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {isApplying ? "Đang gửi..." : "Gửi CV"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
