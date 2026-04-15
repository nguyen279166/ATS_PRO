import { mockJobs, mockCandidates } from "../api/mockData";
import { Briefcase, Users, UserCheck, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const totalJobs = mockJobs.length;
  const totalCandidates = mockCandidates.length;
  const hiredCount = mockCandidates.filter((c) => c.status === "Hired").length;
  const interviewingCount = mockCandidates.filter(
    (c) => c.status === "Interviewing",
  ).length;
  const appliedCount = mockCandidates.filter(
    (c) => c.status === "Applied",
  ).length;
  const rejectedCount = mockCandidates.filter(
    (c) => c.status === "Rejected",
  ).length;
  const hireRate =
    totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  const statsCards = [
    {
      title: "Tổng tin tuyển dụng",
      value: totalJobs,
      icon: Briefcase,
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Tổng ứng viên",
      value: totalCandidates,
      icon: Users,
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Đã tuyển",
      value: hiredCount,
      icon: UserCheck,
      color: "bg-amber-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Tỷ lệ tuyển",
      value: `${hireRate}%`,
      icon: TrendingUp,
      color: "bg-rose-500",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
    },
  ];

  // DỮ LIỆU CHO BIỂU ĐỒ CỘT: Số ứng viên theo từng Job
  const barChartData = mockJobs.map((job) => ({
    name:
      job.title.length > 15 ? job.title.substring(0, 15) + "..." : job.title,
    candidates: mockCandidates.filter((candidate) => candidate.jobId === job.id)
      .length,
  }));

  // DỮ LIỆU CHO BIỂU ĐỒ TRÒN: Phân bổ trạng thái ứng viên
  const pieChartData = [
    { name: "Applied", value: appliedCount },
    { name: "Interviewing", value: interviewingCount },
    { name: "Hired", value: hiredCount },
    { name: "Rejected", value: rejectedCount },
  ];
  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div className='overflow-hidden'>
      {/* HÀNG 1: CÁC THẺ THỐNG KÊ */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.bgLight} p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all`}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className={`${card.color} p-3 rounded-xl text-white`}>
                  <Icon size={22} />
                </div>
              </div>
              <p className='text-sm text-slate-500 font-medium'>{card.title}</p>
              <p className={`text-3xl font-bold mt-1 ${card.textColor}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* HÀNG 2: HAI BIỂU ĐỒ NGANG NHAU */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {/* Biểu đồ Cột: Số ứng viên theo Job */}
        <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-6'>
          <h3 className='text-lg font-bold text-slate-800 mb-6'>
            Ứng viên theo vị trí
          </h3>
          <ResponsiveContainer width='100%' height={280}>
            <BarChart data={barChartData}>
              <XAxis dataKey='name' tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Bar dataKey='candidates' fill='#3b82f6' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ Tròn: Phân bổ trạng thái */}
        <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-6'>
          <h3 className='text-lg font-bold text-slate-800 mb-6'>
            Phân bổ trạng thái
          </h3>
          <ResponsiveContainer width='100%' height={280}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey='value'
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HÀNG 3: BẢNG DANH SÁCH ỨNG VIÊN GẦN ĐÂY */}
      <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-6'>
        <h3 className='text-lg font-bold text-slate-800 mb-4'>
          Ứng viên gần đây
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='text-sm text-slate-500 border-b border-slate-100'>
                <th className='pb-3 font-semibold'>Tên</th>
                <th className='pb-3 font-semibold'>Email</th>
                <th className='pb-3 font-semibold'>Trạng thái</th>
                <th className='pb-3 font-semibold'>Ngày ứng tuyển</th>
              </tr>
            </thead>
            <tbody>
              {mockCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className='border-b border-slate-50 hover:bg-slate-50 transition-colors'
                >
                  <td className='py-3'>
                    <div className='flex items-center gap-3'>
                      <img
                        src={candidate.avatar}
                        alt=''
                        className='w-8 h-8 rounded-full'
                      />
                      <span className='font-medium text-slate-800'>
                        {candidate.name}
                      </span>
                    </div>
                  </td>
                  <td className='py-3 text-slate-500 text-sm'>
                    {candidate.email}
                  </td>
                  <td className='py-3'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        candidate.status === "Hired"
                          ? "bg-green-100 text-green-700"
                          : candidate.status === "Interviewing"
                            ? "bg-blue-100 text-blue-700"
                            : candidate.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </td>
                  <td className='py-3 text-slate-500 text-sm'>
                    {candidate.appliedDate}
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
