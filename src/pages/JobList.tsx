import { useState } from "react";
import axios from "axios";
import { useData } from "../hooks/DataProvider";
import { Calendar, MapPin, Building, Plus, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AddJobModal from "../components/AddJobModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { Job } from "../types";

export default function JobList() {
  const { jobs, loading, refreshData } = useData();
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
        await axios.put(`http://localhost:3001/api/jobs/${selectedJob.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Cập nhật tin tuyển dụng thành công!");
      } else {
        await axios.post("http://localhost:3001/api/jobs", data, {
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này? Tất cả ứng viên thuộc tin này cũng sẽ bị xóa!")) return;
    try {
      const token = localStorage.getItem("token_lay_duoc");
      await axios.delete(`http://localhost:3001/api/jobs/${jobId}`, {
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
        <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>
          Danh sách tin tuyển dụng
        </h2>
        <button
          onClick={openAddModal}
          className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer'
        >
          <Plus size={18} /> Tạo tin mới
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {jobs.map((job) => (
          <div
            key={job.id}
            className='bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group dark:bg-slate-800 text-black dark:text-white'
          >
            <div className='flex justify-between items-start mb-4'>
              <div className='flex items-center gap-3'>
                <h3 className='font-bold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                  {job.title}
                </h3>
                <button
                  onClick={(e) => openEditModal(e, job)}
                  className='p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                  title='Chỉnh sửa'
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => handleDeleteJob(e, job.id)}
                  className='p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  title='Xóa'
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  job.status === "Open"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {job.status}
              </span>
            </div>

            <div className='space-y-3 text-slate-500 dark:text-slate-400 text-sm mb-6'>
              <div className='flex items-center gap-2'>
                <Building size={16} className='text-slate-400' />{" "}
                <span>{job.department}</span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin size={16} className='text-slate-400' />{" "}
                <span>{job.location}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar size={16} className='text-slate-400' />{" "}
                <span>Đăng ngày: {job.createdAt}</span>
              </div>
            </div>

            <Link to={`/jobs/${job.id}`} className='block mt-4'>
              <button className='w-full py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-colors'>
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
          initialData={selectedJob}
        />
      )}
    </div>
  );
}
