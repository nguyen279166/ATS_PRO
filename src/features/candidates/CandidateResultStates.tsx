import { AlertCircle, RefreshCw, Users } from "lucide-react";

export function CandidateLoadingState() {
  return (
    <div role='status' aria-live='polite'>
      <p className='sr-only'>Đang tải danh sách ứng viên</p>
      <div className='hidden space-y-3 md:block' aria-hidden='true'>
        <div className='h-11 animate-pulse rounded-lg bg-[var(--color-surface-strong)] motion-reduce:animate-none' />
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className='grid min-h-16 animate-pulse grid-cols-[44px_1.4fr_1.3fr_1fr_0.8fr_0.8fr_44px] items-center gap-3 border-b border-[var(--color-border)] motion-reduce:animate-none'
          >
            <span className='mx-auto h-5 w-5 rounded bg-[var(--color-surface-strong)]' />
            <span className='h-4 w-3/4 rounded bg-[var(--color-surface-strong)]' />
            <span className='h-4 w-4/5 rounded bg-[var(--color-surface-strong)]' />
            <span className='h-7 w-4/5 rounded bg-[var(--color-surface-strong)]' />
            <span className='h-7 w-20 rounded-full bg-[var(--color-surface-strong)]' />
            <span className='h-4 w-24 rounded bg-[var(--color-surface-strong)]' />
            <span className='h-8 w-8 rounded bg-[var(--color-surface-strong)]' />
          </div>
        ))}
      </div>

      <div className='space-y-3 md:hidden' aria-hidden='true'>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className='sahara-card-soft min-h-48 animate-pulse p-4 motion-reduce:animate-none'
          >
            <div className='flex items-center gap-3'>
              <span className='h-5 w-5 rounded bg-[var(--color-surface-strong)]' />
              <span className='h-10 w-10 rounded-full bg-[var(--color-surface-strong)]' />
              <span className='h-4 flex-1 rounded bg-[var(--color-surface-strong)]' />
            </div>
            <div className='mt-5 space-y-3'>
              <span className='block h-4 w-full rounded bg-[var(--color-surface-strong)]' />
              <span className='block h-4 w-4/5 rounded bg-[var(--color-surface-strong)]' />
              <span className='block h-4 w-2/3 rounded bg-[var(--color-surface-strong)]' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CandidateErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className='flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-10 text-center'
      role='alert'
    >
      <span className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-strong)] text-[var(--color-danger)]'>
        <AlertCircle size={24} aria-hidden='true' />
      </span>
      <div>
        <h2 className='font-bold text-[var(--color-text)]'>
          Chưa thể tải danh sách
        </h2>
        <p className='mt-1 text-sm text-[var(--color-text-muted)]'>
          {message}. Vui lòng kiểm tra kết nối và thử lại.
        </p>
      </div>
      <button
        type='button'
        onClick={onRetry}
        className='sahara-button-secondary px-4 text-sm'
      >
        <RefreshCw size={17} aria-hidden='true' />
        Thử lại
      </button>
    </div>
  );
}

export function CandidateEmptyState({
  searchTerm,
  activeFilterCount,
  onClear,
}: {
  searchTerm: string;
  activeFilterCount: number;
  onClear: () => void;
}) {
  const hasQuery = Boolean(searchTerm || activeFilterCount);
  const description = searchTerm
    ? "Không có ứng viên phù hợp với tên bạn đang tìm trên trang này."
    : activeFilterCount > 0
      ? "Không có ứng viên phù hợp với các bộ lọc hiện tại."
      : "Danh sách chưa có ứng viên nào để hiển thị.";

  return (
    <div
      className='flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-10 text-center'
      role='status'
    >
      <span className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]'>
        <Users size={24} aria-hidden='true' />
      </span>
      <div>
        <h2 className='font-bold text-[var(--color-text)]'>
          Không tìm thấy ứng viên
        </h2>
        <p className='mt-1 max-w-md text-sm text-[var(--color-text-muted)]'>
          {description}
        </p>
      </div>
      {hasQuery && (
        <button
          type='button'
          onClick={onClear}
          className='sahara-button-secondary px-4 text-sm'
        >
          Xóa tìm kiếm và bộ lọc
        </button>
      )}
    </div>
  );
}
