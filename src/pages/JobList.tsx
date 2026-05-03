import { useState } from "react";
import axios from "axios";
import { useData } from "../hooks/DataProvider";
import { Calendar, MapPin, Building, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import AddJobModal from "../components/AddJobModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function JobList() {
  const { jobs, loading, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }
  const handleAddJob = async (data: { title: string; department: string; location: string }) => {
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const res = await axios.post(
        "http://localhost:3001/api/jobs",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshData();
      toast.success("Đăng tin tuyển dụng thành công!");
    } catch (error: any) {
      console.error("Lỗi khi tạo job:", error);
      toast.error(error.response?.data?.error || "Lỗi khi tạo Job. Mở console để xem chi tiết!");
    }
  };

  return (
    <div>
      <ToastContainer position='bottom-right' />
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-slate-800'>Danh sách tin tuyển dụng</h2>
        <button
          onClick={() => setShowModal(true)}
          className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer'
        >
          <Plus size={18} /> Tạo tin mới
        </button>
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {jobs.map((job) => (
        <div
          key={job.id}
          className='bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group'
        >
          <div className='flex justify-between items-start mb-4'>
            <h3 className='font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors'>
              {job.title}
            </h3>
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

          <div className='space-y-3 text-slate-500 text-sm mb-6'>
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
            <button className='w-full py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-colors'>
              Mở Kanban Board
            </button>
          </Link>
        </div>
      ))}
      </div>
      
      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddJob}
        />
      )}
    </div>
  );
}
