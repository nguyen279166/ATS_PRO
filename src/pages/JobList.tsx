import { useState } from "react";
import axios from "axios";
import { useData } from "../hooks/DataProvider";
import { useAuth } from "../hooks/useAuth";
import { Calendar, MapPin, Building, Plus, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AddJobModal from "../components/AddJobModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { Job } from "../types";
import { API_BASE_URL } from "../config/env";

export default function JobList() {
  const { jobs, loading, refreshData } = useData();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const handleSaveJob = async (data: {
    title: string;
    department: string;
    location: string;
    description: string;
  }) => {
    try {
      const token = localStorage.getItem("token_lay_duoc");
      if (selectedJob) {
        await axios.put(
          `${API_BASE_URL}/api/jobs/${selectedJob.id}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        toast.success("Cập nhật tin tuyển dụng thành công!");
      } else {
        await axios.post(`${API_BASE_URL}/api/jobs`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Đăng tin tuyển dụng thành công!");
      }
      await refreshData();
    } catch (error: unknown) {
      console.error("Lỗi khi lưu job:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error ||
            "Lỗi khi lưu Job. Mở console để xem chi tiết!",
        );
      } else {
        toast.error("Lỗi khi lưu Job. Mở console để xem chi tiết!");
      }
    }
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
    )
      return;
    try {
      const token = localStorage.getItem("token_lay_duoc");
      await axios.delete(`${API_BASE_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Xóa Job thành công!");
      await refreshData();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Lỗi khi xóa Job");
      } else {
        toast.error("Lỗi khi xóa Job");
      }
    }
  };

  const openEditModal = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowModal(true);
  };

  return (
    <div>
      <ToastContainer position='bottom-right' />
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-black text-[#3a302a]'>
          Danh sách tin tuyển dụng
        </h2>
        <button
          onClick={openAddModal}
          className='sahara-button px-5 py-2.5 cursor-pointer'
        >
          <Plus size={18} /> Tạo tin mới
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {jobs.map((job) => (
          <div
            key={job.id}
            className='sahara-card p-5 hover:-translate-y-1 transition-all cursor-pointer group text-[#3a302a]'
          >
            <div className='flex items-start gap-3 mb-4'>
              <div className='flex min-w-0 flex-1 items-start gap-2'>
                <h3 className='min-h-12 min-w-0 flex-1 pr-2 font-black text-base leading-snug text-[#3a302a] group-hover:text-[#8a4518] transition-colors'>
                  {job.title}
                </h3>
                <button
                  onClick={(e) => openEditModal(e, job)}
                  className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9a7655] hover:text-[#8a4518] hover:bg-[#f4dfbd] transition-colors'
                  title='Chỉnh sửa'
                >
                  <Edit2 size={14} />
                </button>
                {isAdmin && (
                  <button
                    onClick={(e) => handleDeleteJob(e, job.id)}
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9a7655] hover:text-[#8c3c3c] hover:bg-[#f2ded4] transition-colors'
                    title='Xóa (chỉ Admin)'
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <span
                className={`mt-0.5 shrink-0 ${
                  job.status === "Open"
                    ? "sahara-status sahara-status-hired"
                    : "sahara-status sahara-status-applied"
                }`}
              >
                {job.status}
              </span>
            </div>

            <div className='space-y-3 text-[#7d6f62] text-sm mb-6'>
              <div className='flex items-center gap-2'>
                <Building size={16} className='text-[#b88954]' />{" "}
                <span>{job.department}</span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin size={16} className='text-[#b88954]' />{" "}
                <span>{job.location}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar size={16} className='text-[#b88954]' />{" "}
                <span>Đăng ngày: {job.createdAt}</span>
              </div>
            </div>

            <Link to={`/jobs/${job.id}`} className='block mt-4'>
              <button className='sahara-button-secondary w-full py-2.5'>
                Mở Kanban Board
              </button>
            </Link>
          </div>
        ))}
      </div>

      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveJob}
          initialData={selectedJob ?? undefined}
        />
      )}
    </div>
  );
}
