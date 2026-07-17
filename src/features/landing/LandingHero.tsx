import {
  ArrowRight,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

type LandingHeroProps = {
  openJobsCount: number;
  jobsLoading: boolean;
};

export function LandingHero({
  openJobsCount,
  jobsLoading,
}: LandingHeroProps) {
  const stats = [
    {
      label: "Vị trí đang mở",
      value: jobsLoading ? "—" : openJobsCount,
    },
    { label: "Ứng viên đã nhận", value: "10K+" },
    { label: "Đội ngũ tuyển dụng", value: "24/7" },
  ];

  return (
    <section className='mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 sm:px-8 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-16'>
      <div className='min-w-0'>
        <p className='mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-primary)]'>
          <Sparkles size={16} aria-hidden='true' />
          Không gian tuyển dụng Sahara
        </p>
        <h1
          id='landing-page-title'
          className='max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl'
          tabIndex={-1}
        >
          Cơ hội nghề nghiệp tại ATS PRO
        </h1>
        <p className='mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg sm:leading-8'>
          Khám phá các vị trí đang mở và gửi CV trực tiếp vào quy trình tuyển
          dụng của ATS PRO.
        </p>
        <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
          <a href='#jobs' className='sahara-button px-5 py-3'>
            Xem vị trí đang tuyển
            <ArrowRight size={18} aria-hidden='true' />
          </a>
          <Link to='/login' className='sahara-button-secondary px-5 py-3'>
            Vào hệ thống
          </Link>
        </div>
      </div>

      <aside
        className='sahara-card p-5 sm:p-6'
        aria-labelledby='landing-summary-title'
      >
        <div className='mb-5 flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-bold uppercase text-[var(--color-primary)]'>
              Thông tin tuyển dụng
            </p>
            <h2
              id='landing-summary-title'
              className='mt-1 text-2xl font-black'
            >
              Tuyển dụng hôm nay
            </h2>
          </div>
          <span
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-primary)]'
            aria-hidden='true'
          >
            <BriefcaseBusiness size={22} />
          </span>
        </div>
        <dl className='grid gap-1'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='flex items-center justify-between gap-4 border-b border-[var(--color-border)] py-3 last:border-b-0'
            >
              <dt className='text-sm font-bold text-[var(--color-text-muted)]'>
                {stat.label}
              </dt>
              <dd className='text-2xl font-black text-[var(--color-primary)] [font-variant-numeric:tabular-nums]'>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
