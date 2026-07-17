import { BarChart3 } from "lucide-react";
import type { CandidatesByJobData } from "./dashboardData";

type CandidatesByJobChartProps = {
  data: CandidatesByJobData[];
};

export function CandidatesByJobChart({ data }: CandidatesByJobChartProps) {
  const maxCandidates = Math.max(
    ...data.map((job) => job.candidates),
    1,
  );
  const largest = data[0];
  const hasCandidates = data.some((job) => job.candidates > 0);
  const summary =
    hasCandidates && largest
      ? `Hiển thị tối đa 8 vị trí. ${largest.fullName} có nhiều ứng viên nhất với ${largest.candidates} hồ sơ.`
      : "Chưa có ứng viên theo vị trí tuyển dụng.";

  return (
    <section
      className='sahara-card min-w-0 p-4 sm:p-5'
      aria-labelledby='dashboard-jobs-chart-title'
    >
      <h2
        id='dashboard-jobs-chart-title'
        className='flex items-center gap-2 text-lg font-bold text-[var(--color-text)]'
      >
        <BarChart3
          size={20}
          className='text-[var(--color-primary)]'
          aria-hidden='true'
        />
        Các vị trí có nhiều ứng viên nhất
      </h2>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
        {summary}
      </p>

      {hasCandidates ? (
        <ol className='mt-5 min-h-60 space-y-3'>
          {data.map((job) => {
            const width = Math.max(
              (job.candidates / maxCandidates) * 100,
              job.candidates > 0 ? 8 : 0,
            );
            return (
              <li key={job.jobId}>
                <div className='mb-1.5 flex items-center justify-between gap-3 text-sm'>
                  <span
                    className='min-w-0 truncate font-bold text-[var(--color-text)]'
                    title={job.fullName}
                    aria-label={job.fullName}
                  >
                    {job.name}
                  </span>
                  <span className='shrink-0 font-black text-[var(--color-text)] [font-variant-numeric:tabular-nums]'>
                    {job.candidates}
                    <span className='sr-only'> ứng viên</span>
                  </span>
                </div>
                <div
                  className='h-3 overflow-hidden rounded-full bg-[var(--color-surface-strong)]'
                  role='progressbar'
                  aria-label={`${job.fullName}: ${job.candidates} ứng viên`}
                  aria-valuemin={0}
                  aria-valuemax={maxCandidates}
                  aria-valuenow={job.candidates}
                >
                  <div
                    className='h-full rounded-full bg-[var(--color-primary)]'
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div
          className='mt-4 flex min-h-60 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm font-semibold text-[var(--color-text-muted)]'
          role='status'
        >
          Dữ liệu theo vị trí sẽ xuất hiện sau khi có hồ sơ ứng tuyển.
        </div>
      )}
    </section>
  );
}
