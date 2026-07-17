import {
  ArrowRight,
  Building,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import type { Job } from "../../types";

type OpenJobsSectionProps = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onApply: (job: Job) => void;
};

function JobsLoadingState() {
  return (
    <div role='status' aria-live='polite'>
      <span className='sr-only'>Đang tải danh sách công việc…</span>
      <div className='grid gap-4' aria-hidden='true'>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className='sahara-card animate-pulse p-5 motion-reduce:animate-none'
          >
            <div className='h-6 w-2/3 rounded bg-[var(--color-surface-strong)]' />
            <div className='mt-4 h-4 w-1/2 rounded bg-[var(--color-surface-strong)]' />
            <div className='mt-3 h-4 w-full rounded bg-[var(--color-surface-subtle)]' />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenJobsSection({
  jobs,
  loading,
  error,
  onRetry,
  onApply,
}: OpenJobsSectionProps) {
  return (
    <section
      id='jobs'
      className='mx-auto max-w-6xl scroll-mt-4 px-4 pb-20 sm:px-8'
      aria-labelledby='open-jobs-title'
      aria-busy={loading}
    >
      <div className='mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
        <div>
          <p className='text-sm font-bold uppercase text-[var(--color-primary)]'>
            Cơ hội nghề nghiệp
          </p>
          <h2 id='open-jobs-title' className='mt-1 text-3xl font-black'>
            Vị trí đang tuyển
          </h2>
        </div>
        <p className='inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-bold text-[var(--color-text-muted)]'>
          <Users size={16} aria-hidden='true' />
          Ứng tuyển trong vài phút
        </p>
      </div>

      {loading ? (
        <JobsLoadingState />
      ) : error ? (
        <div
          className='sahara-card flex flex-col items-center gap-4 p-8 text-center'
          role='alert'
        >
          <div>
            <h3 className='text-lg font-bold text-[var(--color-text)]'>
              Chưa thể tải vị trí tuyển dụng
            </h3>
            <p className='mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]'>
              {error}
            </p>
          </div>
          <button
            type='button'
            className='sahara-button-secondary px-4 py-2'
            onClick={onRetry}
          >
            <RefreshCw size={17} aria-hidden='true' />
            Thử tải lại
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className='sahara-card p-8 text-center' role='status'>
          <h3 className='text-lg font-bold text-[var(--color-text)]'>
            Chưa có vị trí đang mở
          </h3>
          <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
            ATS PRO chưa đăng vị trí mới. Vui lòng quay lại sau để xem cơ hội
            phù hợp.
          </p>
        </div>
      ) : (
        <ul className='space-y-4'>
          {jobs.map((job) => (
            <li key={job.id}>
              <article className='sahara-card p-4 sm:p-5'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <h3 className='text-xl font-black text-[var(--color-text)]'>
                      {job.title}
                    </h3>
                    <div className='mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[var(--color-text-muted)]'>
                      <span className='flex items-center gap-1.5'>
                        <Building size={16} aria-hidden='true' />
                        {job.department}
                      </span>
                      <span className='flex items-center gap-1.5'>
                        <MapPin size={16} aria-hidden='true' />
                        {job.location}
                      </span>
                      <span className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-2.5 py-1 text-xs font-bold text-[var(--color-text)]'>
                        Đăng bởi {job.user?.fullName || "ATS PRO"}
                      </span>
                    </div>
                    {job.description && (
                      <p className='mt-4 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]'>
                        {job.description}
                      </p>
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={() => onApply(job)}
                    className='sahara-button shrink-0 px-5 py-2.5 text-sm'
                    aria-haspopup='dialog'
                    aria-controls='job-application-dialog'
                    aria-label={`Ứng tuyển vị trí ${job.title}`}
                  >
                    Ứng tuyển ngay
                    <ArrowRight size={16} aria-hidden='true' />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
