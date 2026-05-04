import { useState } from "react";
import { X } from "lucide-react";

interface AddJobModalProps {
  onClose: () => void;
  onSave: (job: { title: string; department: string; location: string; description: string }) => void;
  initialData?: { title: string; department: string; location: string; description: string | null };
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
        className='bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-white'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-bold text-slate-800 dark:text-white'>
            {initialData ? "Cập nhật tin tuyển dụng" : "Tạo tin tuyển dụng mới"}
          </h3>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1 dark:text-white'>
              Chức danh (Job Title)
            </label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ví dụ: Frontend Engineer'
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-700 dark:border-slate-800 dark:text-white'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1 dark:text-white'>
              Phòng ban
            </label>
            <input
              type='text'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder='Ví dụ: Tech'
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-700 dark:border-slate-800 dark:text-white'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1 dark:text-white'>
              Địa điểm
            </label>
            <input
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Ví dụ: Hà Nội'
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all  dark:bg-slate-700'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-1 dark:text-white'>
              Mô tả công việc (JD)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Nhập chi tiết yêu cầu công việc...'
              rows={4}
              className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-700 dark:border-slate-800 dark:text-white resize-none'
            />
          </div>

          <button
            type='submit'
            className='w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors mt-2 '
          >
            {initialData ? "Lưu thay đổi" : "Đăng tuyển"}
          </button>
        </form>
      </div>
    </div>
  );
}
