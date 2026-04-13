import { useParams } from "react-router-dom";
import { mockJobs, mockCandidates } from "../api/mockData";

export default function KanbanBoard() {
  const { jobId } = useParams(); // useParams là "máy quét" lấy đuôi URL (ví dụ: JOB-01) xuống làm biến số

  // 1. Tìm thông tin Job từ kho dữ liệu giả
  const currentJob = mockJobs.find((job) => job.id === jobId);

  // 2. Lọc ra đúng những ứng viên đang nộp vào Job này (môn Toán cơ bản: c.jobId === JOB-01)
  const jobCandidates = mockCandidates.filter((c) => c.jobId === jobId);

  // Mảng thiết kế 4 cột
  const columns = [
    { title: "Applied", status: "Applied" as const },
    { title: "Interviewing", status: "Interviewing" as const },
    { title: "Hired", status: "Hired" as const },
    { title: "Rejected", status: "Rejected" as const },
  ];

  if (!currentJob) return <div>Không tìm thấy công việc!</div>; // Lỡ user gõ bậy bạ lên URL

  return (
    <div className='h-full flex flex-col'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-800'>
          {currentJob.title}
        </h3>
        <p className='text-slate-500 mt-1'>Sơ đồ tuyển dụng ứng viên</p>
      </div>

      {/* Grid chia 4 cột Kanban đều nhau */}
      <div className='grid grid-cols-4 gap-6 flex-1 min-h-[500px]'>
        {/* Lặp 4 vòng để vẽ ra 4 cột Cứng */}
        {columns.map((col) => {
          // Lọc tiếp ứng viên thuộc trạng thái của 1 Cột nhất định (ví dụ Cột Hired có bao nhiêu người)
          const columnCandidates = jobCandidates.filter(
            (candidate) => candidate.status === col.status,
          );

          return (
            <div
              key={col.title}
              className='bg-slate-100 rounded-2xl p-4 flex flex-col gap-4 border border-slate-200'
            >
              {/* Header của một Cột */}
              <div className='flex justify-between items-center px-1'>
                <h4 className='font-bold text-slate-700'>{col.title}</h4>
                <span className='bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold'>
                  {columnCandidates.length}
                </span>
              </div>

              {/* Body của Cột: Chứa các thẻ Card (Ứng viên) */}
              <div className='flex-1 flex flex-col gap-3 min-h-[150px]'>
                {/* Lặp để đổ các Ứng viên xuống thành dạng Thẻ (Card) */}
                {columnCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className='bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all'
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      <img
                        src={candidate.avatar}
                        alt='avatar'
                        className='w-8 h-8 rounded-full bg-slate-100'
                      />
                      <div>
                        <h5 className='font-bold text-sm text-slate-800'>
                          {candidate.name}
                        </h5>
                        <p className='text-xs text-slate-500 font-medium'>
                          {candidate.appliedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
