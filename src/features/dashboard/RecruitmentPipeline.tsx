import { ListFilter } from "lucide-react";
import type { PipelineData } from "./dashboardData";

type RecruitmentPipelineProps = {
  data: PipelineData[];
};

export function RecruitmentPipeline({ data }: RecruitmentPipelineProps) {
  const pipelineMax = data[0]?.count || 1;
  const hasCandidates = (data[0]?.count || 0) > 0;
  const interviewCount = data[1]?.count || 0;
  const hiredCount = data[2]?.count || 0;
  const summary = hasCandidates
    ? `Pipeline có ${data[0].count} hồ sơ, ${interviewCount} ứng viên đang hoặc đã qua phỏng vấn và ${hiredCount} ứng viên đã tuyển.`
    : "Chưa có ứng viên trong pipeline tuyển dụng.";

  return (
    <section
      className='sahara-card min-w-0 p-4 sm:p-5'
      aria-labelledby='dashboard-pipeline-title'
    >
      <h2
        id='dashboard-pipeline-title'
        className='flex items-center gap-2 text-lg font-bold text-[var(--color-text)]'
      >
        <ListFilter
          size={20}
          className='text-[var(--color-primary)]'
          aria-hidden='true'
        />
        Pipeline tuyển dụng
      </h2>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
        {summary}
      </p>

      {hasCandidates ? (
        <ol className='mt-5 min-h-60 space-y-4'>
          {data.map((step) => {
            const percent = Math.round((step.count / pipelineMax) * 100);
            return (
              <li key={step.label}>
                <div className='mb-1.5 flex items-center justify-between gap-3 text-sm'>
                  <span className='font-semibold text-[var(--color-text)]'>
                    {step.label}
                  </span>
                  <span className='font-bold text-[var(--color-text)] [font-variant-numeric:tabular-nums]'>
                    {step.count}
                  </span>
                </div>
                <div
                  className='h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-strong)]'
                  role='progressbar'
                  aria-label={`${step.label}: ${step.count} ứng viên, ${percent}% tổng số`}
                  aria-valuemin={0}
                  aria-valuemax={pipelineMax}
                  aria-valuenow={step.count}
                >
                  <div
                    className={`${step.colorClass} h-full rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className='mt-1 text-xs text-[var(--color-text-muted)]'>
                  {percent}% tổng ứng viên
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <div
          className='mt-4 flex min-h-60 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm font-semibold text-[var(--color-text-muted)]'
          role='status'
        >
          Pipeline sẽ xuất hiện sau khi có hồ sơ ứng tuyển.
        </div>
      )}
    </section>
  );
}
