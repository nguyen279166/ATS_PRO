import {
  Briefcase,
  Clock3,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardMetricsData } from "./dashboardData";

type DashboardMetricsProps = {
  metrics: DashboardMetricsData;
};

type MetricCard = {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  accentClass: string;
  gridClass: string;
  featured?: boolean;
};

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const cards: MetricCard[] = [
    {
      title: "Tổng ứng viên",
      value: metrics.totalCandidates,
      detail: `${metrics.appliedCount} hồ sơ mới đang chờ đánh giá`,
      icon: Users,
      accentClass: "bg-[#ffb55f] text-[#271508]",
      gridClass: "xl:col-span-5",
      featured: true,
    },
    {
      title: "Tin tuyển dụng",
      value: metrics.totalJobs,
      detail: `${metrics.openJobs} vị trí đang mở`,
      icon: Briefcase,
      accentClass: "bg-[var(--color-primary)] text-white",
      gridClass: "xl:col-span-2",
    },
    {
      title: "Đang phỏng vấn",
      value: metrics.interviewingCount,
      detail: `${metrics.rejectedCount} đã từ chối`,
      icon: Clock3,
      accentClass: "bg-[#fff0df] text-[#b24b18]",
      gridClass: "xl:col-span-3",
    },
    {
      title: "Đã tuyển",
      value: metrics.hiredCount,
      detail: `Tỷ lệ tuyển ${metrics.hireRate}%`,
      icon: UserCheck,
      accentClass: "bg-[#ddf5ec] text-[#126b52]",
      gridClass: "xl:col-span-2",
    },
  ];

  return (
    <section aria-labelledby='dashboard-metrics-title'>
      <h2 id='dashboard-metrics-title' className='sr-only'>
        Các chỉ số tuyển dụng chính
      </h2>
      <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.gridClass} relative min-w-0 overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_28px_rgba(16,24,40,0.06)] sm:p-6 ${
                card.featured
                  ? "border-white/5 bg-[#17181b] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
              }`}
            >
              {card.featured && (
                <span
                  className='absolute -right-8 -top-14 h-36 w-36 rounded-full border border-white/10 shadow-[0_0_0_26px_rgba(255,255,255,0.025),0_0_0_52px_rgba(255,255,255,0.018)]'
                  aria-hidden='true'
                />
              )}
              <dt className='relative flex items-start justify-between gap-3'>
                <span>
                  <span
                    className={`block text-[10px] font-black uppercase tracking-[0.18em] ${
                      card.featured ? "text-white/55" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {card.title}
                  </span>
                </span>
                <span
                  className={`${card.accentClass} inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm`}
                  aria-hidden='true'
                >
                  <Icon size={19} />
                </span>
              </dt>
              <dd
                className={`relative mt-5 font-black leading-none tracking-[-0.045em] [font-variant-numeric:tabular-nums] ${
                  card.featured ? "text-5xl sm:text-6xl" : "text-4xl"
                }`}
              >
                {card.value}
              </dd>
              <dd
                className={`relative mt-3 text-xs font-semibold leading-5 ${
                  card.featured ? "text-white/60" : "text-[var(--color-text-muted)]"
                }`}
              >
                {card.detail}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
