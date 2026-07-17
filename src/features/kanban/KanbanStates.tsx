import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function KanbanLoading() {
  return (
    <div className='space-y-5' role='status' aria-live='polite'>
      <p className='text-sm font-bold text-[var(--sahara-muted)]'>
        Đang tải quy trình tuyển dụng...
      </p>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className='sahara-card-soft min-h-60 space-y-4 p-4 motion-safe:animate-pulse xl:min-h-[480px]'
            aria-hidden='true'
          >
            <div className='h-5 w-2/3 rounded bg-[var(--color-surface-strong)]' />
            <div className='h-28 rounded-lg bg-[var(--color-surface)]' />
            <div className='h-28 rounded-lg bg-[var(--color-surface)]' />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanJobNotFound() {
  return (
    <div className='sahara-card mx-auto max-w-xl p-6 text-center text-[var(--sahara-text)]'>
      <h1 className='text-xl font-black'>Không tìm thấy công việc</h1>
      <p className='mt-2 text-sm leading-6 text-[var(--sahara-muted)]'>
        Công việc có thể đã bị xoá hoặc đường dẫn không còn hợp lệ.
      </p>
      <Link to='/jobs' className='sahara-button-secondary mt-5 px-4'>
        <ArrowLeft aria-hidden='true' size={18} />
        Quay lại danh sách công việc
      </Link>
    </div>
  );
}
