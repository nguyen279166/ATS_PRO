import { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CalendarPlus, MapPin, FileText, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { API_BASE_URL } from "../config/env";

interface Interview {
  id: string;
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  status: "Scheduled" | "Done" | "Cancelled";
  createdAt: string;
  creator: { fullName: string; avatar: string | null };
}

interface Props {
  candidateId: string;
}

const STATUS_CONFIG = {
  Scheduled: { label: "Đã lên lịch", icon: Clock, color: "sahara-status sahara-status-interviewing" },
  Done: { label: "Đã xong", icon: CheckCircle, color: "sahara-status sahara-status-hired" },
  Cancelled: { label: "Đã huỷ", icon: XCircle, color: "sahara-status sahara-status-rejected" },
};

export default function CandidateInterviews({ candidateId }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token_lay_duoc");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/interviews/${candidateId}`, { headers });
      setInterviews(res.data);
    } catch {
      toast.error("Lỗi khi tải lịch phỏng vấn");
    } finally {
      setLoading(false);
    }
  }, [candidateId, headers]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/interviews`,
        { candidateId, scheduledAt, location, notes },
        { headers }
      );
      setInterviews([...interviews, res.data]);
      setShowForm(false);
      setScheduledAt("");
      setLocation("");
      setNotes("");
      toast.success("Đã thêm lịch phỏng vấn!");
    } catch {
      toast.error("Lỗi khi tạo lịch phỏng vấn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/interviews/${id}`, { status }, { headers });
      setInterviews(interviews.map((iv) => (iv.id === id ? res.data : iv)));
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa lịch phỏng vấn này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/interviews/${id}`, { headers });
      setInterviews(interviews.filter((iv) => iv.id !== id));
      toast.success("Đã xóa lịch phỏng vấn");
    } catch {
      toast.error("Lỗi khi xóa lịch phỏng vấn");
    }
  };

  const formatDateTime = (dt: string) => {
    const date = new Date(dt);
    return date.toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-black text-[#3a302a]">
          Lịch phỏng vấn ({interviews.length})
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="sahara-button px-3 py-2 text-sm"
        >
          <CalendarPlus size={15} />
          Thêm lịch
        </button>
      </div>

      {/* Form thêm mới */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="sahara-card-soft flex flex-col gap-3 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-bold text-[#7d6f62]">
              Ngày giờ phỏng vấn *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="sahara-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#7d6f62]">
              Địa điểm / Link Meet
            </label>
            <input
              type="text"
              placeholder="VD: Phòng họp A3 hoặc https://meet.google.com/..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="sahara-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#7d6f62]">
              Ghi chú
            </label>
            <textarea
              placeholder="Nội dung cần chuẩn bị, câu hỏi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="sahara-input w-full resize-none px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#7d6f62] transition-colors hover:bg-[#f4dfbd]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="sahara-button px-4 py-2 text-sm disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu lịch"}
            </button>
          </div>
        </form>
      )}

      {/* Danh sách lịch PV */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#c2652a]" />
        </div>
      ) : interviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#9a7655]">Chưa có lịch phỏng vấn nào</p>
      ) : (
        <div className="flex flex-col gap-3">
          {interviews.map((iv) => {
            const statusCfg = STATUS_CONFIG[iv.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={iv.id}
                className="flex flex-col gap-2 rounded-lg border border-[#d8c8b5] bg-[#fff7eb] p-4 shadow-sm"
              >
                {/* Row 1: thời gian + status + delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#3a302a]">
                      {formatDateTime(iv.scheduledAt)}
                    </p>
                    {iv.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[#7d6f62]">
                        <MapPin size={12} />
                        <span>{iv.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Dropdown đổi status */}
                    <select
                      value={iv.status}
                      onChange={(e) => handleStatusChange(iv.id, e.target.value)}
                      className={`cursor-pointer border-0 text-xs font-bold ${statusCfg.color}`}
                    >
                      <option value="Scheduled">Đã lên lịch</option>
                      <option value="Done">Đã xong</option>
                      <option value="Cancelled">Đã huỷ</option>
                    </select>
                    <button
                      onClick={() => handleDelete(iv.id)}
                      className="rounded-lg p-1 text-[#9a7655] transition-colors hover:bg-[#f2ded4] hover:text-[#8c3c3c]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Row 2: ghi chú nếu có */}
                {iv.notes && (
                  <div className="flex items-start gap-1.5 text-xs text-[#7d6f62]">
                    <FileText size={12} className="mt-0.5 shrink-0" />
                    <span>{iv.notes}</span>
                  </div>
                )}

                {/* Row 3: ai tạo */}
                <div className="flex items-center gap-1.5 border-t border-[#d8c8b5]/70 pt-1">
                  <StatusIcon size={12} className="text-[#9a7655]" />
                  <span className="text-xs text-[#9a7655]">
                    Tạo bởi {iv.creator.fullName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
