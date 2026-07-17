import { useState } from "react";
import {
  Briefcase,
  Building,
  Calendar,
  Edit2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient, isApiError } from "../api/client";
import AddJobModal from "../components/AddJobModal";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/DataProvider";
import type { Job } from "../types";
import { formatDate } from "../utils/date";

export default function JobList() {
  const { jobs, loading, refreshData } = useData();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleSaveJob = async (data: {
    title: string;
    department: string;
    location: string;
    description: string;
  }) => {
    try {
      if (selectedJob) {
        await apiClient.put(`/api/jobs/${selectedJob.id}`, data);
        toast.success("Cập nhật tin tuyển dụng thành công!");
      } else {
        await apiClient.post("/api/jobs", data);
        toast.success("Đăng tin tuyển dụng thành công!");
      }
    } catch (error: unknown) {
      console.error("Lỗi khi lưu job:", error);
      toast.error(
        isApiError(error)
          ? error.response?.data?.error || "Không thể lưu tin tuyển dụng."
          : "Không thể lưu tin tuyển dụng.",
      );
      return false;
    }

    try {
      await refreshData();
    } catch (error) {
      console.error("Không thể tải lại danh sách tin tuyển dụng:", error);
      toast.warning("Đã lưu tin nhưng chưa thể tải lại danh sách.");
    }
    return true;
  };

  const openAddModal = () => {
    setSelectedJob(null);
    setShowModal(true);
  };

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa tin tuyển dụng này? Tất cả ứng viên thuộc tin này cũng sẽ bị xóa!",
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/jobs/${jobId}`);
      toast.success("Xóa tin tuyển dụng thành công!");
    } catch (error: unknown) {
      toast.error(
        isApiError(error)
          ? error.response?.data?.error || "Không thể xóa tin tuyển dụng."
          : "Không thể xóa tin tuyển dụng.",
      );
      return;
    }

    try {
      await refreshData();
    } catch (error) {
      console.error("Không thể tải lại danh sách sau khi xóa:", error);
      toast.warning("Đã xóa tin nhưng chưa thể tải lại danh sách.");
    }
  };

  const openEditModal = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div
        className='flex min-h-[40vh] items-center justify-center'
        role='status'
        aria-live='polite'
      >
        <div className='flex items-center gap-3 text-sm font-semibold text-[var(--color-text-muted)]'>
          <span className='h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]' />
          Đang tải tin tuyển dụng…
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby='jobs-heading'>
      <div className='mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
        <div>
          <h2
            id='jobs-heading'
            className='text-xl font-bold text-[var(--color-text)] sm:text-2xl'
          >
            Vị trí đang tuyển
          </h2>
          <p className='mt-1 text-sm text-[var(--color-text-muted)]'>
            {jobs.length} tin tuyển dụng trong không gian làm việc
          </p>
        </div>
        <button
          type='button'
          onClick={openAddModal}
          className='sahara-button w-full cursor-pointer px-5 py-2.5 sm:w-auto'
        >
          <Plus size={18} aria-hidden='true' /> Tạo tin mới
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className='sahara-card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center'>
          <span className='mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-strong)] text-[var(--color-primary)]'>
            <Briefcase size={24} aria-hidden='true' />
          </span>
          <h3 className='text-lg font-bold text-[var(--color-text)]'>
            Chưa có tin tuyển dụng
          </h3>
          <p className='mt-2 max-w-md text-sm text-[var(--color-text-muted)]'>
            Tạo vị trí đầu tiên để bắt đầu tiếp nhận và theo dõi ứng viên.
          </p>
          <button
            type='button'
            onClick={openAddModal}
            className='sahara-button mt-5 px-5 py-2.5'
          >
            <Plus size={18} aria-hidden='true' /> Tạo tin đầu tiên
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {jobs.map((job) => (
            <article
              key={job.id}
              className='sahara-card flex min-h-full flex-col p-5 text-[var(--color-text)]'
            >
              <div className='mb-4 flex items-start gap-3'>
                <div className='flex min-w-0 flex-1 items-start gap-1'>
                  <h3 className='min-h-12 min-w-0 flex-1 pr-2 text-base font-extrabold leading-snug'>
                    {job.title}
                  </h3>
                  <button
                    type='button'
                    onClick={(e) => openEditModal(e, job)}
                    className='sahara-icon-button shrink-0'
                    aria-label={`Chỉnh sửa tin ${job.title}`}
                  >
                    <Edit2 size={16} aria-hidden='true' />
                  </button>
                  {isAdmin && (
                    <button
                      type='button'
                      onClick={(e) => handleDeleteJob(e, job.id)}
                      className='sahara-icon-button shrink-0 hover:!bg-[var(--color-surface-strong)] hover:!text-[var(--color-danger)]'
                      aria-label={`Xóa tin ${job.title}`}
                    >
                      <Trash2 size={16} aria-hidden='true' />
                    </button>
                  )}
                </div>
                <span
                  className={`mt-1 shrink-0 ${
                    job.status === "Open"
                      ? "sahara-status sahara-status-hired"
                      : "sahara-status sahara-status-applied"
                  }`}
                >
                  {job.status === "Open" ? "Đang mở" : "Đã đóng"}
                </span>
              </div>

              <dl className='mb-6 space-y-3 text-sm text-[var(--color-text-muted)]'>
                <div className='flex items-center gap-2'>
                  <Building size={16} className='text-[var(--color-primary)]' aria-hidden='true' />
                  <dt className='sr-only'>Phòng ban</dt>
                  <dd>{job.department}</dd>
                </div>
                <div className='flex items-center gap-2'>
                  <MapPin size={16} className='text-[var(--color-primary)]' aria-hidden='true' />
                  <dt className='sr-only'>Địa điểm</dt>
                  <dd>{job.location}</dd>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar size={16} className='text-[var(--color-primary)]' aria-hidden='true' />
                  <dt className='sr-only'>Ngày đăng</dt>
                  <dd>Đăng ngày: {formatDate(job.createdAt)}</dd>
                </div>
              </dl>

              <Link
                to={`/jobs/${job.id}`}
                className='sahara-button-secondary mt-auto min-h-11 w-full px-4 py-2.5'
                aria-label={`Mở pipeline ứng viên cho ${job.title}`}
              >
                Mở pipeline ứng viên
              </Link>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveJob}
          initialData={selectedJob ?? undefined}
        />
      )}
    </section>
  );
}
