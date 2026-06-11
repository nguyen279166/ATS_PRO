import { useData } from "../hooks/DataProvider";
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  XCircle,
  TrendingUp,
  ChartPie,
  BarChart3,
  ListFilter,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const { jobs, candidates, loading } = useData();

  if (loading) {
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // ── STAT NUMBERS ──────────────────────────────────────────────
  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => j.status === "Open").length;
  const totalCandidates = candidates.length;
  const hiredCount = candidates.filter((c) => c.status === "Hired").length;
  const interviewingCount = candidates.filter(
    (c) => c.status === "Interviewing",
  ).length;
  const appliedCount = candidates.filter((c) => c.status === "Applied").length;
  const rejectedCount = candidates.filter(
    (c) => c.status === "Rejected",
  ).length;
  const hireRate =
    totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  const statsCards = [
    {
      title: "Tin tuyển dụng",
      value: totalJobs,
      sub: `${openJobs} đang mở`,
      icon: Briefcase,
      color: "bg-[#d9a441]",
      bgLight: "sahara-card",
      textColor: "text-[#8a5b18]",
    },
    {
      title: "Tổng ứng viên",
      value: totalCandidates,
      sub: `${appliedCount} mới nộp`,
      icon: Users,
      color: "bg-[#c2652a]",
      bgLight: "sahara-card",
      textColor: "text-[#8a4518]",
    },
    {
      title: "Đã tuyển",
      value: hiredCount,
      sub: `Tỷ lệ ${hireRate}%`,
      icon: UserCheck,
      color: "bg-[#b88954]",
      bgLight: "sahara-card",
      textColor: "text-[#7a4d26]",
    },
    {
      title: "Đang phỏng vấn",
      value: interviewingCount,
      sub: `${rejectedCount} đã từ chối`,
      icon: Clock,
      color: "bg-[#6f7f5a]",
      bgLight: "sahara-card",
      textColor: "text-[#587143]",
    },
  ];

  // ── BAR CHART: ứng viên theo job ─────────────────────────────
  const barChartData = jobs
    .map((job) => ({
      name:
        job.title.length > 15 ? job.title.substring(0, 15) + "…" : job.title,
      candidates: candidates.filter((c) => c.jobId === job.id).length,
    }))
    .sort((a, b) => b.candidates - a.candidates)
    .slice(0, 8);

  // ── PIE CHART: phân bổ trạng thái ────────────────────────────
  const pieChartData = [
    { name: "Applied", value: appliedCount },
    { name: "Interviewing", value: interviewingCount },
    { name: "Hired", value: hiredCount },
    { name: "Rejected", value: rejectedCount },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = ["#d9a441", "#c2652a", "#6f7f5a", "#8c3c3c"];
  const totalStatus = pieChartData.reduce((sum, item) => sum + item.value, 0);
  let statusDegrees = 0;
  const statusGradient =
    totalStatus > 0
      ? pieChartData
          .map((item, index) => {
            const start = statusDegrees;
            statusDegrees += (item.value / totalStatus) * 360;
            return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}deg ${statusDegrees}deg`;
          })
          .join(", ")
      : "#ead9bf 0deg 360deg";
  const maxJobCandidates =
    Math.max(...barChartData.map((job) => job.candidates), 1);

  // ── LINE CHART: xu hướng 6 tháng gần nhất ────────────────────
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = d.toLocaleDateString("vi-VN", {
      month: "short",
      year: "2-digit",
    });
    const count = candidates.filter((c) => {
      const cd = new Date(c.appliedDate);
      return (
        cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth()
      );
    }).length;
    return { month: label, "Ứng viên": count };
  });

  // ── PIPELINE FUNNEL ──────────────────────────────────────────
  const pipeline = [
    {
      label: "Nộp đơn",
      count: appliedCount + interviewingCount + hiredCount + rejectedCount,
      color: "bg-[#d9a441]",
    },
    {
      label: "Phỏng vấn",
      count: interviewingCount + hiredCount,
      color: "bg-[#c2652a]",
    },
    { label: "Đã tuyển", count: hiredCount, color: "bg-[#6f7f5a]" },
  ];
  const pipelineMax = pipeline[0].count || 1;

  return (
    <div className='overflow-hidden space-y-6'>
      {/* HÀNG 1: STAT CARDS */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.bgLight} p-4 hover:-translate-y-0.5 transition-all`}
            >
              <div className='flex items-center justify-between mb-3'>
                <div className={`${card.color} p-2.5 rounded-lg text-white shadow-sm`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className='text-xs text-[#7d6f62] font-bold uppercase'>
                {card.title}
              </p>
              <p
                className={`text-3xl font-black mt-1 ${card.textColor}`}
              >
                {card.value}
              </p>
              <p className='text-xs text-[#9a7655] mt-1'>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* HÀNG 2: LINE CHART + PIE CHART */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Line Chart: xu hướng theo tháng */}
        <div className='sahara-card p-5'>
          <h3 className='mb-5 flex items-center gap-2 text-base font-black text-[#3a302a]'>
            <TrendingUp size={18} className='text-[#c2652a]' />
            Xu hướng ứng tuyển (6 tháng)
          </h3>
          <ResponsiveContainer width='100%' height={240}>
            <LineChart data={monthlyData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#ead9bf' />
              <XAxis dataKey='month' tick={{ fontSize: 11, fill: "#7d6f62" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7d6f62" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #d8c8b5",
                  fontSize: 13,
                }}
              />
              <Line
                type='monotone'
                dataKey='Ứng viên'
                stroke='#c2652a'
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#c2652a" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: trạng thái */}
        <div className='sahara-card p-5'>
          <h3 className='mb-5 flex items-center gap-2 text-base font-black text-[#3a302a]'>
            <ChartPie size={18} className='text-[#c2652a]' />
            Phân bổ trạng thái
          </h3>
          <div className='grid min-h-[240px] grid-cols-1 items-center gap-5 sm:grid-cols-[180px_1fr]'>
            <div className='relative mx-auto h-40 w-40'>
              <div
                className='absolute inset-0 rounded-full shadow-inner'
                style={{ background: `conic-gradient(${statusGradient})` }}
              />
              <div className='absolute inset-7 flex flex-col items-center justify-center rounded-full border border-[#d8c8b5] bg-[#fffaf2] text-center'>
                <span className='text-3xl font-black text-[#3a302a]'>
                  {totalStatus}
                </span>
                <span className='text-[11px] font-bold uppercase text-[#6f4e2f]'>
                  total
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              {pieChartData.length > 0 ? (
                pieChartData.map((item, index) => {
                  const percent = Math.round((item.value / totalStatus) * 100);
                  return (
                    <div
                      key={item.name}
                      className='rounded-lg border border-[#ead9bf] bg-[#fff7eb] px-3 py-2'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          <span
                            className='h-2.5 w-2.5 rounded-full'
                            style={{
                              background:
                                PIE_COLORS[index % PIE_COLORS.length],
                            }}
                          />
                          <span className='text-sm font-bold text-[#4f4034]'>
                            {item.name}
                          </span>
                        </div>
                        <span className='text-sm font-black text-[#3a302a]'>
                          {item.value}
                        </span>
                      </div>
                      <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-[#ead9bf]'>
                        <div
                          className='h-full rounded-full'
                          style={{
                            width: `${percent}%`,
                            background:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='rounded-lg border border-dashed border-[#d8c8b5] bg-[#fff7eb] p-4 text-sm font-semibold text-[#9a7655]'>
                  Chua co du lieu trang thai.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 3: BAR CHART + PIPELINE */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Bar Chart: ứng viên theo vị trí */}
        <div className='sahara-card p-5'>
          <h3 className='mb-5 flex items-center gap-2 text-base font-black text-[#3a302a]'>
            <BarChart3 size={18} className='text-[#c2652a]' />
            Top vị trí nhiều ứng viên
          </h3>
          <div className='min-h-[240px] space-y-3'>
            {barChartData.length > 0 ? (
              barChartData.map((job, index) => {
                const width = Math.max(
                  (job.candidates / maxJobCandidates) * 100,
                  job.candidates > 0 ? 8 : 0,
                );
                return (
                  <div key={`${job.name}-${index}`}>
                    <div className='mb-1.5 flex items-center justify-between gap-3 text-sm'>
                      <span className='truncate font-bold text-[#4f4034]'>
                        {job.name}
                      </span>
                      <span className='font-black text-[#3a302a]'>
                        {job.candidates}
                      </span>
                    </div>
                    <div className='h-3 overflow-hidden rounded-full bg-[#ead9bf]'>
                      <div
                        className='h-full rounded-full bg-[#c2652a] transition-all duration-500'
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-[#d8c8b5] bg-[#fff7eb] text-sm font-semibold text-[#9a7655]'>
                Chua co du lieu ung vien theo vi tri.
              </div>
            )}
          </div>
        </div>

        {/* Pipeline funnel */}
        <div className='sahara-card p-5'>
          <h3 className='mb-5 flex items-center gap-2 text-base font-black text-[#3a302a]'>
            <ListFilter size={18} className='text-[#c2652a]' />
            Pipeline tuyển dụng
          </h3>
          <div className='space-y-4 mt-2'>
            {pipeline.map((step) => (
              <div key={step.label}>
                <div className='flex justify-between text-sm mb-1.5'>
                  <span className='font-medium text-[#5b4a3a]'>
                    {step.label}
                  </span>
                  <span className='font-bold text-[#3a302a]'>
                    {step.count}
                  </span>
                </div>
                <div className='w-full bg-[#ead9bf] rounded-full h-3'>
                  <div
                    className={`${step.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${(step.count / pipelineMax) * 100}%` }}
                  />
                </div>
                <p className='text-xs text-[#9a7655] mt-1'>
                  {pipelineMax > 0
                    ? Math.round((step.count / pipelineMax) * 100)
                    : 0}
                  % tổng ứng viên
                </p>
              </div>
            ))}

            {/* Rejected riêng */}
            <div className='pt-2 border-t border-[#d8c8b5]/70'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm text-[#7d6f62]'>
                  <XCircle size={14} className='text-[#8c3c3c]' />
                  Đã từ chối
                </div>
                <span className='font-bold text-[#8c3c3c]'>{rejectedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 4: BẢNG ỨNG VIÊN GẦN ĐÂY */}
      <div className='sahara-card p-5'>
        <h3 className='text-base font-black text-[#3a302a] mb-4'>
          🕒 Ứng viên gần đây
        </h3>
        <div className='overflow-x-auto'>
          <table className='sahara-table text-left'>
            <thead>
              <tr>
                <th className='pb-3 font-semibold'>Tên</th>
                <th className='pb-3 font-semibold'>Email</th>
                <th className='pb-3 font-semibold'>Vị trí</th>
                <th className='pb-3 font-semibold'>Trạng thái</th>
                <th className='pb-3 font-semibold'>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {[...candidates]
                .sort(
                  (a, b) =>
                    new Date(b.appliedDate).getTime() -
                    new Date(a.appliedDate).getTime(),
                )
                .slice(0, 6)
                .map((candidate) => (
                  <tr
                    key={candidate.id}
                    className='hover:bg-[#fff4e2] transition-colors'
                  >
                    <td className='py-3'>
                      <div className='flex items-center gap-3'>
                        <img
                          src={
                            candidate.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`
                          }
                          alt=''
                          className='w-8 h-8 rounded-full'
                        />
                        <span className='font-medium text-[#3a302a]'>
                          {candidate.name}
                        </span>
                      </div>
                    </td>
                    <td className='py-3 text-[#7d6f62] text-sm'>
                      {candidate.email}
                    </td>
                    <td className='py-3 text-[#7d6f62] text-sm'>
                      {candidate.job?.title || "—"}
                    </td>
                    <td className='py-3'>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          candidate.status === "Hired"
                            ? "sahara-status sahara-status-hired"
                            : candidate.status === "Interviewing"
                              ? "sahara-status sahara-status-interviewing"
                              : candidate.status === "Rejected"
                                ? "sahara-status sahara-status-rejected"
                                : "sahara-status sahara-status-applied"
                        }`}
                      >
                        {candidate.status}
                      </span>
                    </td>
                    <td className='py-3 text-[#7d6f62] text-sm'>
                      {new Date(candidate.appliedDate).toLocaleDateString(
                        "vi-VN",
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
