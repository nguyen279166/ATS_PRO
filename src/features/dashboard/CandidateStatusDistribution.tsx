import { ChartPie } from "lucide-react";
import type { CandidateStatusData } from "./dashboardData";

type CandidateStatusDistributionProps = {
  data: CandidateStatusData[];
};

const buildStatusGradient = (
  data: CandidateStatusData[],
  total: number,
) => {
  let currentDegrees = 0;
  return data
    .map((item) => {
      const start = currentDegrees;
      currentDegrees += (item.value / total) * 360;
      return `${item.color} ${start}deg ${currentDegrees}deg`;
    })
    .join(", ");
};

export function CandidateStatusDistribution({
  data,
}: CandidateStatusDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const largest = data.reduce<CandidateStatusData | null>(
    (currentLargest, item) =>
      !currentLargest || item.value > currentLargest.value
        ? item
        : currentLargest,
    null,
  );
  const summary =
    total > 0 && largest
      ? `Có ${total} ứng viên. Nhóm lớn nhất là ${largest.label.toLowerCase()} với ${largest.value} ứng viên.`
      : "Chưa có ứng viên để phân tích trạng thái.";

  return (
    <section
      className='sahara-card min-w-0 p-4 sm:p-5'
      aria-labelledby='dashboard-status-title'
    >
      <h2
        id='dashboard-status-title'
        className='flex items-center gap-2 text-lg font-bold text-[var(--color-text)]'
      >
        <ChartPie
          size={20}
          className='text-[var(--color-primary)]'
          aria-hidden='true'
        />
        Phân bổ trạng thái ứng viên
      </h2>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
        {summary}
      </p>

      {total > 0 ? (
        <div className='mt-4 grid min-h-60 grid-cols-1 items-center gap-5 sm:grid-cols-[180px_minmax(0,1fr)]'>
          <div
            className='relative mx-auto h-40 w-40'
            role='img'
            aria-label={summary}
          >
            <div
              className='absolute inset-0 rounded-full shadow-inner'
              style={{
                background: `conic-gradient(${buildStatusGradient(data, total)})`,
              }}
              aria-hidden='true'
            />
            <div className='absolute inset-7 flex flex-col items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-center'>
              <span className='text-3xl font-black text-[var(--color-text)] [font-variant-numeric:tabular-nums]'>
                {total}
              </span>
              <span className='text-xs font-bold uppercase text-[var(--color-text-muted)]'>
                Tổng
              </span>
            </div>
          </div>

          <ul className='space-y-3' aria-label='Chi tiết trạng thái ứng viên'>
            {data.map((item) => {
              const percent = Math.round((item.value / total) * 100);
              return (
                <li
                  key={item.status}
                  className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <span className='flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--color-text)]'>
                      <span
                        className='h-2.5 w-2.5 shrink-0 rounded-full'
                        style={{ background: item.color }}
                        aria-hidden='true'
                      />
                      {item.label}
                    </span>
                    <span className='text-sm font-black text-[var(--color-text)] [font-variant-numeric:tabular-nums]'>
                      {item.value}
                      <span className='sr-only'> ứng viên, {percent}%</span>
                    </span>
                  </div>
                  <div
                    className='mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-strong)]'
                    role='progressbar'
                    aria-label={`${item.label}: ${percent}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div
                      className='h-full rounded-full'
                      style={{ width: `${percent}%`, background: item.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div
          className='mt-4 flex min-h-60 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm font-semibold text-[var(--color-text-muted)]'
          role='status'
        >
          Dữ liệu trạng thái sẽ xuất hiện sau khi có ứng viên.
        </div>
      )}
    </section>
  );
}
