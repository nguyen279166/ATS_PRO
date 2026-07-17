import { LoaderCircle } from "lucide-react";

export function DashboardLoadingState() {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <h1 className='sr-only'>Tổng quan tuyển dụng</h1>
      <div
        className='sahara-card flex items-center gap-3 px-5 py-4 text-sm font-semibold text-[var(--color-text)]'
        role='status'
        aria-live='polite'
      >
        <LoaderCircle
          className='h-5 w-5 animate-spin text-[var(--color-primary)] motion-reduce:animate-none'
          aria-hidden='true'
        />
        <span>Đang tải tổng quan tuyển dụng…</span>
      </div>
    </div>
  );
}
