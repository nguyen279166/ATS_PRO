import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useData } from "../hooks/DataProvider";
import axios from "axios";
import type { Candidate, CandidateStatus, Job } from "../types";
import { Search, X } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import AddCandidateModal from "../components/AddCandidateModal";
import CandidateNotes from "../components/CandidateNotes";
import CandidateInterviews from "../components/CandidateInterviews";
import CandidateCV from "../components/CandidateCV";
import CandidateAskAi from "../components/CandidateAskAi";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import Avatar from "../components/Avatar";
import { formatDate } from "../utils/date";
import { toast } from "react-toastify";

type StatusUpdateResponse = {
  candidate: Candidate;
  notification: {
    attempted: boolean;
    delivery?: {
      sent: boolean;
      reason?: "not_configured" | "send_failed";
    };
  };
};

const candidatePanelTabs = [
  { key: "notes", label: "Ghi chú" },
  { key: "interviews", label: "Lịch PV" },
  { key: "cv", label: "CV" },
  { key: "ai", label: "AI" },
] as const;

export default function KanbanBoard() {
  const { jobId } = useParams();
  const {
    jobs,
    candidates: globalCandidates,
    loading,
    refreshData,
    updateCandidate,
  } = useData();

  const currentJob = jobs.find((j: Job) => j.id === jobId);
  const [localCandidateState, setLocalCandidateState] = useState<{
    jobId?: string;
    candidates: Candidate[];
  } | null>(null);

  const globalJobCandidates = useMemo(
    () => globalCandidates.filter((c: Candidate) => c.jobId === jobId),
    [globalCandidates, jobId],
  );
  const candidates =
    localCandidateState && localCandidateState.jobId === jobId
      ? localCandidateState.candidates
      : globalJobCandidates;

  // Lưu chữ đang gõ (Cái này thay đổi liên tục, làm React rặn render liên tục)
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<(typeof candidatePanelTabs)[number]["key"]>("notes");

  const updateSelectedCandidate = (
    candidateId: string,
    updates: Partial<Candidate>,
  ) => {
    setSelectedCandidate((prev) =>
      prev?.id === candidateId ? { ...prev, ...updates } : prev,
    );
    updateCandidate(candidateId, updates);
    setLocalCandidateState((prev) => {
      const prevCandidates =
        prev && prev.jobId === jobId ? prev.candidates : candidates;
      return {
        jobId,
        candidates: prevCandidates.map((candidate) =>
          candidate.id === candidateId ? { ...candidate, ...updates } : candidate,
        ),
      };
    });
  };

  // Dùng bảo kiếm: Chặn từ khoá lại, khi tay người gõ ngưng nghỉ đủ 500ms thì mới thả chạy
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  console.log("Giá trị debounce hiện tại:", debouncedSearchTerm);

  // TẠO DỮ LIỆU PHÁI SINH (Rất quan trọng):
  // Thay vì lấy toàn bộ ứng viên quăng hươu quăng vượn, ta đẩy qua cái màng lọc Tên trước
  const visibleCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  // Mảng thiết kế 4 cột
  const columns = [
    { title: "Applied", status: "Applied" as const, accent: "border-t-[#b88954]" },
    { title: "Interviewing", status: "Interviewing" as const, accent: "border-t-[#c2652a]" },
    { title: "Hired", status: "Hired" as const, accent: "border-t-[#6f7f5a]" },
    { title: "Rejected", status: "Rejected" as const, accent: "border-t-[#8c3c3c]" },
  ];

  const persistCandidateStatus = async (
    candidateId: string,
    newStatus: CandidateStatus,
  ) => {
    const token = localStorage.getItem("token_lay_duoc");
    const response = await axios.put<StatusUpdateResponse>(
      `${API_BASE_URL}/api/candidates/${candidateId}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    updateCandidate(candidateId, { status: newStatus });

    const notification = response.data.notification;
    if (notification?.delivery?.sent) {
      toast.success(`Đã chuyển sang ${newStatus} và gửi email cho ứng viên`);
    } else if (notification?.attempted) {
      toast.warning(
        "Trạng thái đã cập nhật nhưng email chưa gửi được. Kiểm tra cấu hình SMTP.",
      );
    } else {
      toast.success(`Đã chuyển ứng viên sang ${newStatus}`);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: CandidateStatus) => {
    // Móc ID của ứng viên trong túi hành lý (được gói lúc DragStart)
    const candidateId = e.dataTransfer.getData("candidateId");

    // Optimistic update: cập nhật UI ngay lập tức
    setLocalCandidateState((prev) => {
      const prevCandidates =
        prev && prev.jobId === jobId ? prev.candidates : candidates;
      const draggedCandidate = prevCandidates.find(
        (candidate) => candidate.id === candidateId,
      );
      if (!draggedCandidate) return { jobId, candidates: prevCandidates };
      if (draggedCandidate.status === newStatus) {
        return { jobId, candidates: prevCandidates };
      }
      const remainingCandidates = prevCandidates.filter(
        (candidate) => candidate.id !== candidateId,
      );
      remainingCandidates.push({ ...draggedCandidate, status: newStatus });
      return { jobId, candidates: remainingCandidates };
    });

    // BÁO CÁO LÊN BACKEND:
    try {
      await persistCandidateStatus(candidateId, newStatus);
    } catch (error) {
      console.error("Lỗi khi lưu trạng thái kéo thả:", error);
      toast.error("Không thể cập nhật trạng thái ứng viên");
      await refreshData(false);
    }
  };
  const handleAddCandidate = async (data: {
    name: string;
    email: string;
    status: CandidateStatus;
  }) => {
    try {
      const token = localStorage.getItem("token_lay_duoc");
      const res = await axios.post(
        `${API_BASE_URL}/api/candidates`,
        {
          name: data.name,
          email: data.email,
          jobId: jobId,
          status: data.status,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const newCandidate: Candidate = {
        id: res.data.id,
        name: data.name,
        email: data.email,
        jobId: jobId || "",
        status: data.status,
        appliedDate: res.data.appliedDate ?? new Date().toISOString(),
      };
      setLocalCandidateState((prev) => {
        const prevCandidates =
          prev && prev.jobId === jobId ? prev.candidates : candidates;
        return { jobId, candidates: [...prevCandidates, newCandidate] };
      });
      refreshData(); // Đồng bộ Global state
    } catch (error) {
      console.error("Lỗi tạo candidate:", error);
    }
  };

  const handleDropOnCard = async (
    e: React.DragEvent,
    targetId: string,
    newStatus: CandidateStatus,
  ) => {
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData("candidateId");
    if (draggedId === targetId) return;
    setLocalCandidateState((prev) => {
      const prevCandidates =
        prev && prev.jobId === jobId ? prev.candidates : candidates;
      // 1. Tìm vị trí Index hiện tại của 2 người
      const draggedIndex = prevCandidates.findIndex((c) => c.id === draggedId);
      const targetIndex = prevCandidates.findIndex((c) => c.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) {
        return { jobId, candidates: prevCandidates };
      }
      // 2. Tạo bản sao của mảng để thao tác
      const newArray = [...prevCandidates];
      // 3. Rút anh kéo (A) ra khỏi mảng
      const [draggedItem] = newArray.splice(draggedIndex, 1);

      // 4. Mặc áo mới cho anh (đề phòng kéo thả qua cột khác mà rớt trúng thẻ người ta)
      const updatedDraggedItem = { ...draggedItem, status: newStatus };
      // 5. Chèn anh A vào đúng vị trí Index của người bị thả đè lên (B)
      newArray.splice(targetIndex, 0, updatedDraggedItem);
      return { jobId, candidates: newArray };
    });

    // BÁO CÁO LÊN BACKEND:
    try {
      await persistCandidateStatus(draggedId, newStatus);
    } catch (error) {
      console.error("Lỗi khi lưu trạng thái kéo thả (đè thẻ):", error);
      toast.error("Không thể cập nhật trạng thái ứng viên");
      await refreshData(false);
    }
  };

  if (loading)
    return (
      <div className='flex items-center justify-center h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  if (!currentJob) return <div>Không tìm thấy công việc!</div>; // Lỡ user gõ bậy bạ lên URL

  return (
    <div className='h-full flex flex-col'>
      <div className='mb-6 flex justify-between items-end'>
        <div>
          <Link
            to='/jobs'
            className='flex items-center gap-1 text-sm text-[#9a7655] hover:text-[#8a4518] transition-colors mb-2'
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>
          <h3 className='text-2xl font-black text-[#3a302a]'>
            {currentJob.title}
          </h3>
          <p className='text-[#7d6f62] mt-1'>Sơ đồ tuyển dụng ứng viên</p>
        </div>

        {/* Cục Thanh Tìm Kiếm Ứng Viên */}
        <div className='flex items-center gap-4'>
          <div className='relative w-96 text-[#3a302a]'>
            <label className='absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7655]'>
              <Search size={18} />
            </label>
            <input
              type='text'
              placeholder='Tìm theo tên ứng viên...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='sahara-input w-full pl-10 pr-4 py-2 shadow-sm'
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className='sahara-button px-5 py-2 cursor-pointer'
          >
            <Plus size={18} /> Thêm
          </button>
        </div>
      </div>

      {/* Grid chia 4 cột Kanban đều nhau */}
      <div className='grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-[600px]'>
        {/* Lặp 4 vòng để vẽ ra 4 cột Cứng */}
        {columns.map((col) => {
          // Lọc tiếp ứng viên thuộc trạng thái của 1 Cột nhất định (ví dụ Cột Hired có bao nhiêu người)
          const columnCandidates = visibleCandidates.filter(
            (candidate) => candidate.status === col.status,
          );

          return (
            <div
              key={col.title}
              className={`sahara-card-soft border-t-4 ${col.accent} p-4 flex flex-col gap-4 text-[#3a302a]`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Header của một Cột */}
              <div className='flex justify-between items-center px-1'>
                <h4 className='font-black text-[#3a302a]'>
                  {col.title}
                </h4>
                <span className='bg-[#efe2cc] text-[#7a4d26] px-2 py-0.5 rounded-md text-xs font-bold'>
                  {columnCandidates.length}
                </span>
              </div>

              {/* Body của Cột: Chứa các thẻ Card (Ứng viên) */}
              <div className='flex-1 flex flex-col gap-3 min-h-[150px]'>
                {/* Lặp để đổ các Ứng viên xuống thành dạng Thẻ (Card) */}
                {columnCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className='bg-[#fffaf2] p-4 rounded-lg shadow-sm border border-[#d8c8b5] cursor-grab hover:shadow-md hover:border-[#c2652a] hover:-translate-y-1 transition-all'
                    onClick={() => setSelectedCandidate(candidate)}
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
                      <Avatar
                        name={candidate.name}
                        className='h-8 w-8 text-xs'
                      />
                      <div>
                        <h5 className='font-bold text-sm text-[#3a302a]'>
                          {candidate.name}
                        </h5>
                        <p className='text-xs text-[#7d6f62] font-medium'>
                          {formatDate(candidate.appliedDate)}
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
      {/* Modal thêm ứng viên - Chỉ hiện khi showModal = true */}
      {showModal && (
        <AddCandidateModal
          jobId={jobId!}
          onClose={() => setShowModal(false)}
          onAdd={handleAddCandidate}
        />
      )}

      {/* Slide Panel - Ghi chú ứng viên */}
      {selectedCandidate && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          {/* Backdrop mờ */}
          <div
            className='flex-1 bg-black/30 backdrop-blur-sm'
            onClick={() => setSelectedCandidate(null)}
          />
          {/* Panel bên phải */}
          <div className='w-full max-w-md bg-[#fffaf2] h-full shadow-2xl flex flex-col'>
            {/* Header panel */}
            <div className='flex items-center justify-between p-5 border-b border-[#d8c8b5] shrink-0'>
              <div className='flex items-center gap-3'>
                <Avatar
                  name={selectedCandidate.name}
                  className='h-10 w-10 text-sm'
                />
                <div>
                  <h3 className='font-bold text-[#3a302a]'>
                    {selectedCandidate.name}
                  </h3>
                  <p className='text-xs text-[#7d6f62]'>
                    {selectedCandidate.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className='p-2 text-[#9a7655] hover:text-[#3a302a] hover:bg-[#f4dfbd] rounded-lg transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className='flex border-b border-[#d8c8b5] shrink-0'>
              {candidatePanelTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "text-[#c2652a] border-b-2 border-[#c2652a]"
                      : "text-[#9a7655] hover:text-[#3a302a]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className='p-5 flex-1 overflow-y-auto'>
              <div className={activeTab === "notes" ? "block" : "hidden"}>
                <CandidateNotes
                  candidateId={selectedCandidate.id}
                  candidateName={selectedCandidate.name}
                />
              </div>
              <div className={activeTab === "interviews" ? "block" : "hidden"}>
                <CandidateInterviews candidateId={selectedCandidate.id} />
              </div>
              <div className={activeTab === "cv" ? "block" : "hidden"}>
                <CandidateCV
                  candidateId={selectedCandidate.id}
                  candidateName={selectedCandidate.name}
                  initialCvUrl={selectedCandidate.cvUrl}
                  initialCvFileName={selectedCandidate.cvFileName}
                  onCvChange={(updates) =>
                    updateSelectedCandidate(selectedCandidate.id, updates)
                  }
                />
              </div>
              <div className={activeTab === "ai" ? "block" : "hidden"}>
                <CandidateAskAi
                  candidateId={selectedCandidate.id}
                  candidateName={selectedCandidate.name}
                  resetKey={`${selectedCandidate.cvUrl || ""}:${selectedCandidate.cvFileName || ""}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
