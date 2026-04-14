import { useParams } from "react-router-dom";
import { mockJobs, mockCandidates } from "../api/mockData";
import { useState } from "react";
import type { Candidate, CandidateStatus } from "../types";

export default function KanbanBoard() {
  const { jobId } = useParams(); // useParams là "máy quét" lấy đuôi URL (ví dụ: JOB-01) xuống làm biến số

  // 1. Tìm thông tin Job từ kho dữ liệu giả
  const currentJob = mockJobs.find((job) => job.id === jobId);

  const initialCandidates = mockCandidates.filter(
    (candidate) => candidate.jobId === jobId,
  );
  const [candidates, setCandidates] = useState(initialCandidates);

  // Mảng thiết kế 4 cột
  const columns = [
    { title: "Applied", status: "Applied" as const },
    { title: "Interviewing", status: "Interviewing" as const },
    { title: "Hired", status: "Hired" as const },
    { title: "Rejected", status: "Rejected" as const },
  ];
  const handleDrop = (e: React.DragEvent, newStatus: CandidateStatus) => {
    // Móc ID của ứng viên trong túi hành lý (được gói lúc DragStart)
    const candidateId = e.dataTransfer.getData("candidateId");

    // Yêu cầu React cập nhật mảng: Thằng nào có ID đúng khớp thì đổi trạng thái sang tên cột mới
    setCandidates((prev: Candidate[]) => {
      const draggedCandidate = prev.find(
        (candidate) => candidate.id === candidateId,
      );
      if (!draggedCandidate) return prev;
      if (draggedCandidate.status === newStatus) return prev;
      const remainingCandidates = prev.filter(
        (candidate) => candidate.id !== candidateId,
      );
      remainingCandidates.push({ ...draggedCandidate, status: newStatus });
      return remainingCandidates;
    });
  };

  const handleDropOnCard = (
    e: React.DragEvent,
    targetId: string,
    newStatus: CandidateStatus,
  ) => {
    e.stopPropagation(); // 🟡 LỆNH BÀI LÁ CHẮN: Cấm không cho sự kiện Rớt lọt xuyên qua Card chui xuống Cột.

    const draggedId = e.dataTransfer.getData("candidateId");
    if (draggedId === targetId) return; // Nhấc lên rồi thả rớt trúng đầu chính mình thì thôi
    setCandidates((prev) => {
      // 1. Tìm vị trí Index hiện tại của 2 người
      const draggedIndex = prev.findIndex((c) => c.id === draggedId);
      const targetIndex = prev.findIndex((c) => c.id === targetId);
      // 2. Tạo bản sao của mảng để thao tác
      const newArray = [...prev];
      // 3. Rút anh kéo (A) ra khỏi mảng
      const [draggedItem] = newArray.splice(draggedIndex, 1);

      // 4. Mặc áo mới cho anh (đề phòng kéo thả qua cột khác mà rớt trúng thẻ người ta)
      draggedItem.status = newStatus;
      // 5. Chèn anh A vào đúng vị trí Index của người bị thả đè lên (B)
      newArray.splice(targetIndex, 0, draggedItem);
      return newArray;
    });
  };

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
          const columnCandidates = candidates.filter(
            (candidate) => candidate.status === col.status,
          );

          return (
            <div
              key={col.title}
              className='bg-slate-100 rounded-2xl p-4 flex flex-col gap-4 border border-slate-200'
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.status)}
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
                    draggable={true} // Cờ cho phép bế đi
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) =>
                      handleDropOnCard(e, candidate.id, candidate.status)
                    }
                    onDragStart={(e) =>
                      e.dataTransfer.setData("candidateId", candidate.id)
                    } // Túi hành lý mang theo ID
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
