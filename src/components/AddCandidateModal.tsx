import { useState } from "react";
import { X } from "lucide-react";
import type { CandidateStatus } from "../types";

// Định nghĩa "Hợp đồng" cho Modal: Component cha bắt buộc phải cung cấp 2 thứ này
interface AddCandidateModalProps {
  jobId: string;
  onClose: () => void; // Nút đóng: Cha truyền xuống lệnh tắt Modal
  onAdd: (candidate: {
    name: string;
    email: string;
    status: CandidateStatus;
  }) => void; // Khi Submit: Con gửi dữ liệu form ngược lên cho Cha xử lý
}

export default function AddCandidateModal({
  jobId,
  onClose,
  onAdd,
}: AddCandidateModalProps) {
  // State cho từng ô input (Controlled Form: React nắm cổ mọi ô nhập liệu)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CandidateStatus>("Applied");

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault(); // Chặn trình duyệt reload trang (hành vi mặc định của <form>)

    if (!name.trim() || !email.trim()) return; // Validate cơ bản: Không được gửi chuỗi trống
    // Gọi callback gửi dữ liệu lên cho thằng Cha (KanbanBoard)
    onAdd({ name, email, status });
    // Dọn sạch form sau khi Submit
    setName("");
    setEmail("");
    onClose(); // Đóng popup
  };

  return (
    // Backdrop mờ đen phía sau
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
      onClick={onClose}
    >
      {/* Hộp thoại chính - stopPropagation để click bên trong không bị đóng */}
      <div
        className='bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-bold text-slate-800'>
            Thêm ứng viên mới
          </h3>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1'>
              Họ và tên
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Nhập họ tên ứng viên...'
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='email@example.com'
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1'>
              Trạng thái ban đầu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white'
            >
              <option value='Applied'>Applied</option>
              <option value='Interviewing'>Interviewing</option>
              <option value='Hired'>Hired</option>
              <option value='Rejected'>Rejected</option>
            </select>
          </div>

          <button
            type='submit'
            className='w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors mt-2'
          >
            Thêm ứng viên
          </button>
        </form>
      </div>
    </div>
  );
}
