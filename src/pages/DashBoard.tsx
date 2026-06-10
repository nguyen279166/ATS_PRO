import { useData } from "../hooks/DataProvider";
import { Briefcase, Users, UserCheck, TrendingUp, Clock, XCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
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
  const totalJobs        = jobs.length;
  const openJobs         = jobs.filter((j) => j.status === "Open").length;
  const totalCandidates  = candidates.length;
  const hiredCount       = candidates.filter((c) => c.status === "Hired").length;
  const interviewingCount = candidates.filter((c) => c.status === "Interviewing").length;
  const appliedCount     = candidates.filter((c) => c.status === "Applied").length;
  const rejectedCount    = candidates.filter((c) => c.status === "Rejected").length;
  const hireRate         = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  const statsCards = [
    { title: "Tin tuyển dụng", value: totalJobs, sub: `${openJobs} đang mở`, icon: Briefcase, color: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-900/20", textColor: "text-blue-600" },
    { title: "Tổng ứng viên",  value: totalCandidates, sub: `${appliedCount} mới nộp`, icon: Users, color: "bg-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-900/20", textColor: "text-emerald-600" },
    { title: "Đã tuyển",       value: hiredCount, sub: `Tỷ lệ ${hireRate}%`, icon: UserCheck, color: "bg-amber-500", bgLight: "bg-amber-50 dark:bg-amber-900/20", textColor: "text-amber-600" },
    { title: "Đang phỏng vấn", value: interviewingCount, sub: `${rejectedCount} đã từ chối`, icon: Clock, color: "bg-rose-500", bgLight: "bg-rose-50 dark:bg-rose-900/20", textColor: "text-rose-600" },
  ];

  // ── BAR CHART: ứng viên theo job ─────────────────────────────
  const barChartData = jobs
    .map((job) => ({
      name: job.title.length > 15 ? job.title.substring(0, 15) + "…" : job.title,
      candidates: candidates.filter((c) => c.jobId === job.id).length,
    }))
    .sort((a, b) => b.candidates - a.candidates)
    .slice(0, 8);

  // ── PIE CHART: phân bổ trạng thái ────────────────────────────
  const pieChartData = [
    { name: "Applied",      value: appliedCount },
    { name: "Interviewing", value: interviewingCount },
    { name: "Hired",        value: hiredCount },
    { name: "Rejected",     value: rejectedCount },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

  // ── LINE CHART: xu hướng 6 tháng gần nhất ────────────────────
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = d.toLocaleDateString("vi-VN", { month: "short", year: "2-digit" });
    const count = candidates.filter((c) => {
      const cd = new Date(c.appliedDate);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    }).length;
    return { month: label, "Ứng viên": count };
  });

  // ── PIPELINE FUNNEL ──────────────────────────────────────────
  const pipeline = [
    { label: "Nộp đơn",      count: appliedCount + interviewingCount + hiredCount + rejectedCount, color: "bg-blue-500" },
    { label: "Phỏng vấn",    count: interviewingCount + hiredCount, color: "bg-amber-500" },
    { label: "Đã tuyển",     count: hiredCount, color: "bg-emerald-500" },
  ];
  const pipelineMax = pipeline[0].count || 1;

  return (
    <div className='overflow-hidden space-y-6'>

      {/* HÀNG 1: STAT CARDS */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`${card.bgLight} p-5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all`}>
              <div className='flex items-center justify-between mb-3'>
                <div className={`${card.color} p-2.5 rounded-xl text-white`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className='text-sm text-slate-500 dark:text-slate-400 font-medium'>{card.title}</p>
              <p className={`text-3xl font-bold mt-1 ${card.textColor} dark:text-white`}>{card.value}</p>
              <p className='text-xs text-slate-400 mt-1'>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* HÀNG 2: LINE CHART + PIE CHART */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* Line Chart: xu hướng theo tháng */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6'>
          <h3 className='text-base font-bold text-slate-800 dark:text-white mb-5'>📈 Xu hướng ứng tuyển (6 tháng)</h3>
          <ResponsiveContainer width='100%' height={240}>
            <LineChart data={monthlyData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
              <XAxis dataKey='month' tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Line type='monotone' dataKey='Ứng viên' stroke='#3b82f6' strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: trạng thái */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6'>
          <h3 className='text-base font-bold text-slate-800 dark:text-white mb-5'>🥧 Phân bổ trạng thái</h3>
          <ResponsiveContainer width='100%' height={240}>
            <PieChart>
              <Pie data={pieChartData} cx='50%' cy='50%' innerRadius={55} outerRadius={90} paddingAngle={4} dataKey='value'
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType='circle' iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HÀNG 3: BAR CHART + PIPELINE */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* Bar Chart: ứng viên theo vị trí */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6'>
          <h3 className='text-base font-bold text-slate-800 dark:text-white mb-5'>📊 Top vị trí nhiều ứng viên</h3>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={barChartData} margin={{ bottom: 30 }} layout='vertical'>
              <XAxis type='number' allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey='name' type='category' width={110} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Bar dataKey='candidates' fill='#3b82f6' radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, fill: "#64748b" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline funnel */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6'>
          <h3 className='text-base font-bold text-slate-800 dark:text-white mb-5'>🔽 Pipeline tuyển dụng</h3>
          <div className='space-y-4 mt-2'>
            {pipeline.map((step) => (
              <div key={step.label}>
                <div className='flex justify-between text-sm mb-1.5'>
                  <span className='font-medium text-slate-700 dark:text-slate-300'>{step.label}</span>
                  <span className='font-bold text-slate-800 dark:text-white'>{step.count}</span>
                </div>
                <div className='w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3'>
                  <div
                    className={`${step.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${(step.count / pipelineMax) * 100}%` }}
                  />
                </div>
                <p className='text-xs text-slate-400 mt-1'>
                  {pipelineMax > 0 ? Math.round((step.count / pipelineMax) * 100) : 0}% tổng ứng viên
                </p>
              </div>
            ))}

            {/* Rejected riêng */}
            <div className='pt-2 border-t border-slate-100 dark:border-slate-700'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm text-slate-500'>
                  <XCircle size={14} className='text-red-400' />
                  Đã từ chối
                </div>
                <span className='font-bold text-red-500'>{rejectedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 4: BẢNG ỨNG VIÊN GẦN ĐÂY */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6'>
        <h3 className='text-base font-bold text-slate-800 dark:text-white mb-4'>🕒 Ứng viên gần đây</h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700'>
                <th className='pb-3 font-semibold'>Tên</th>
                <th className='pb-3 font-semibold'>Email</th>
                <th className='pb-3 font-semibold'>Vị trí</th>
                <th className='pb-3 font-semibold'>Trạng thái</th>
                <th className='pb-3 font-semibold'>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {[...candidates]
                .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
                .slice(0, 6)
                .map((candidate) => (
                  <tr key={candidate.id} className='border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors'>
                    <td className='py-3'>
                      <div className='flex items-center gap-3'>
                        <img
                          src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`}
                          alt='' className='w-8 h-8 rounded-full'
                        />
                        <span className='font-medium text-slate-800 dark:text-white'>{candidate.name}</span>
                      </div>
                    </td>
                    <td className='py-3 text-slate-500 dark:text-slate-400 text-sm'>{candidate.email}</td>
                    <td className='py-3 text-slate-500 dark:text-slate-400 text-sm'>{candidate.job?.title || "—"}</td>
                    <td className='py-3'>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        candidate.status === "Hired" ? "bg-green-100 text-green-700"
                        : candidate.status === "Interviewing" ? "bg-blue-100 text-blue-700"
                        : candidate.status === "Rejected" ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className='py-3 text-slate-500 dark:text-slate-400 text-sm'>
                      {new Date(candidate.appliedDate).toLocaleDateString("vi-VN")}
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
