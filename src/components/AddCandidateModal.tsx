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
  //  jobId,
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
        className='sahara-card p-8 w-full max-w-md shadow-2xl text-[#3a302a]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-black text-[#3a302a]'>
            Thêm ứng viên mới
          </h3>
          <button
            onClick={onClose}
            className='text-[#9a7655] hover:text-[#3a302a] transition-colors cursor-pointer'
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Họ và tên
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Nhập họ tên ứng viên...'
              className='sahara-input w-full px-4 py-2.5'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='email@example.com'
              className='sahara-input w-full px-4 py-2.5'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Trạng thái ban đầu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              className='sahara-input w-full px-4 py-2.5'
            >
              <option value='Applied'>Applied</option>
              <option value='Interviewing'>Interviewing</option>
              <option value='Hired'>Hired</option>
              <option value='Rejected'>Rejected</option>
            </select>
          </div>

          <button
            type='submit'
            className='sahara-button w-full py-3 mt-2'
          >
            Thêm ứng viên
          </button>
        </form>
      </div>
    </div>
  );
}
