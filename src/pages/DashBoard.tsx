import { mockJobs, mockCandidates } from "../api/mockData";
import { Briefcase, Users, UserCheck, UserX, TrendingUp } from "lucide-react";

export default function Dashboard() {
  // TÍNH TOÁN SỐ LIỆU THỐNG KÊ TỪ DỮ LIỆU GIẢ
  // Đây là "Derived State" (Dữ liệu phái sinh) - không cần useState, chỉ cần tính toán thuần túy
  const totalJobs = mockJobs.length;
  const totalCandidates = mockCandidates.length;
  const hiredCount = mockCandidates.filter((c) => c.status === "Hired").length;
  const rejectedCount = mockCandidates.filter(
    (c) => c.status === "Rejected",
  ).length;
  const interviewingCount = mockCandidates.filter(
    (c) => c.status === "Interviewing",
  ).length;
  const hireRate =
    totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  // Mảng cấu hình các Thẻ thống kê (DRY: Không lặp code 4 lần)
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
      color: "bg-violet-500",
      bgLight: "bg-violet-50",
      textColor: "text-violet-600",
    },
  ];

  return (
    <div>
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

      {/* HÀNG 2: BẢNG DANH SÁCH ỨNG VIÊN GẦN ĐÂY */}
      <div className='bg-white rounded-2xl border border-slate-100 shadow-sm p-6'>
        <h3 className='text-lg font-bold text-slate-800 mb-4'>
          Ứng viên gần đây
        </h3>
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
  );
}
