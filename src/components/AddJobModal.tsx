import { useState } from "react";
import { X } from "lucide-react";
import Dialog from "./ui/Dialog";

interface AddJobModalProps {
  onClose: () => void;
  onSave: (job: {
    title: string;
    department: string;
    location: string;
    description: string;
  }) => Promise<boolean | void> | boolean | void;
  initialData?: {
    title: string;
    department: string;
    location: string;
    description?: string | null;
  };
}

export default function AddJobModal({
  onClose,
  onSave,
  initialData,
}: AddJobModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !title.trim() || !department.trim() || !location.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await onSave({ title, department, location, description });
      if (saved === false) return;

      setTitle("");
      setDepartment("");
      setLocation("");
      setDescription("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog labelledBy='job-dialog-title' onClose={onClose} className='max-w-lg p-5 sm:p-7'>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div>
            <p className='text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]'>
              Tin tuyển dụng
            </p>
            <h2
              id='job-dialog-title'
              className='mt-1 text-xl font-extrabold text-[var(--color-text)]'
            >
            {initialData ? "Cập nhật tin tuyển dụng" : "Tạo tin tuyển dụng mới"}
            </h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='sahara-icon-button -mr-2 -mt-2 shrink-0'
            aria-label='Đóng hộp thoại'
          >
            <X size={20} aria-hidden='true' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-5'
          aria-busy={isSaving}
        >
          <div>
            <label htmlFor='job-title' className='mb-1.5 block text-sm font-semibold text-[var(--color-text)]'>
              Chức danh
            </label>
            <input
              id='job-title'
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ví dụ: Frontend Engineer'
              className='sahara-input w-full px-4 py-2.5'
              autoComplete='organization-title'
              required
            />
          </div>
          <div>
            <label htmlFor='job-department' className='mb-1.5 block text-sm font-semibold text-[var(--color-text)]'>
              Phòng ban
            </label>
            <input
              id='job-department'
              type='text'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder='Ví dụ: Tech'
              className='sahara-input w-full px-4 py-2.5'
              required
            />
          </div>
          <div>
            <label htmlFor='job-location' className='mb-1.5 block text-sm font-semibold text-[var(--color-text)]'>
              Địa điểm
            </label>
            <input
              id='job-location'
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Ví dụ: Hà Nội'
              className='sahara-input w-full px-4 py-2.5'
              autoComplete='address-level2'
              required
            />
          </div>
          <div>
            <label htmlFor='job-description' className='mb-1.5 block text-sm font-semibold text-[var(--color-text)]'>
              Mô tả công việc
            </label>
            <textarea
              id='job-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Nhập chi tiết yêu cầu công việc...'
              rows={4}
              className='sahara-input w-full px-4 py-2.5 resize-none'
            />
          </div>

          <button
            type='submit'
            disabled={isSaving}
            className='sahara-button mt-2 w-full py-3 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSaving
              ? "Đang lưu…"
              : initialData
                ? "Lưu thay đổi"
                : "Đăng tuyển"}
          </button>
        </form>
    </Dialog>
  );
}
