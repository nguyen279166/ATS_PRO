import { useState } from "react";
import { X } from "lucide-react";

interface AddJobModalProps {
  onClose: () => void;
  onSave: (job: { title: string; department: string; location: string; description: string }) => void;
  initialData?: { title: string; department: string; location: string; description?: string | null };
}

export default function AddJobModal({ onClose, onSave, initialData }: AddJobModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !department.trim() || !location.trim()) return;

    onSave({ title, department, location, description });
    setTitle("");
    setDepartment("");
    setLocation("");
    setDescription("");
    onClose();
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='sahara-card p-8 w-full max-w-md shadow-2xl text-[#3a302a]'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-black text-[#3a302a]'>
            {initialData ? "Cập nhật tin tuyển dụng" : "Tạo tin tuyển dụng mới"}
          </h3>
          <button
            onClick={onClose}
            className='text-[#9a7655] hover:text-[#3a302a] transition-colors cursor-pointer'
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Chức danh (Job Title)
            </label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ví dụ: Frontend Engineer'
              className='sahara-input w-full px-4 py-2.5'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Phòng ban
            </label>
            <input
              type='text'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder='Ví dụ: Tech'
              className='sahara-input w-full px-4 py-2.5'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Địa điểm
            </label>
            <input
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Ví dụ: Hà Nội'
              className='sahara-input w-full px-4 py-2.5'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-[#5b4a3a] mb-1'>
              Mô tả công việc (JD)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Nhập chi tiết yêu cầu công việc...'
              rows={4}
              className='sahara-input w-full px-4 py-2.5 resize-none'
            />
          </div>

          <button
            type='submit'
            className='sahara-button w-full py-3 mt-2'
          >
            {initialData ? "Lưu thay đổi" : "Đăng tuyển"}
          </button>
        </form>
      </div>
    </div>
  );
}
