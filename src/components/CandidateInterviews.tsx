import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CalendarPlus, MapPin, FileText, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";

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

const baseUrl = import.meta.env.VITE_BASE_URL;

const STATUS_CONFIG = {
  Scheduled: { label: "Đã lên lịch", icon: Clock, color: "bg-blue-100 text-blue-700" },
  Done: { label: "Đã xong", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  Cancelled: { label: "Đã huỷ", icon: XCircle, color: "bg-red-100 text-red-700" },
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
  const headers = { Authorization: `Bearer ${token}` };

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/interviews/${candidateId}`, { headers });
      setInterviews(res.data);
    } catch {
      toast.error("Lỗi khi tải lịch phỏng vấn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [candidateId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${baseUrl}/api/interviews`,
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
      const res = await axios.put(`${baseUrl}/api/interviews/${id}`, { status }, { headers });
      setInterviews(interviews.map((iv) => (iv.id === id ? res.data : iv)));
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa lịch phỏng vấn này?")) return;
    try {
      await axios.delete(`${baseUrl}/api/interviews/${id}`, { headers });
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
        <h4 className="font-bold text-slate-700 dark:text-slate-200">
          Lịch phỏng vấn ({interviews.length})
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <CalendarPlus size={15} />
          Thêm lịch
        </button>
      </div>

      {/* Form thêm mới */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-3 border border-slate-200 dark:border-slate-700"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Ngày giờ phỏng vấn *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Địa điểm / Link Meet
            </label>
            <input
              type="text"
              placeholder="VD: Phòng họp A3 hoặc https://meet.google.com/..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Ghi chú
            </label>
            <textarea
              placeholder="Nội dung cần chuẩn bị, câu hỏi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm resize-none dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu lịch"}
            </button>
          </div>
        </form>
      )}

      {/* Danh sách lịch PV */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : interviews.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">Chưa có lịch phỏng vấn nào</p>
      ) : (
        <div className="flex flex-col gap-3">
          {interviews.map((iv) => {
            const statusCfg = STATUS_CONFIG[iv.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={iv.id}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
              >
                {/* Row 1: thời gian + status + delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-white">
                      {formatDateTime(iv.scheduledAt)}
                    </p>
                    {iv.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
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
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusCfg.color}`}
                    >
                      <option value="Scheduled">Đã lên lịch</option>
                      <option value="Done">Đã xong</option>
                      <option value="Cancelled">Đã huỷ</option>
                    </select>
                    <button
                      onClick={() => handleDelete(iv.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Row 2: ghi chú nếu có */}
                {iv.notes && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <FileText size={12} className="mt-0.5 shrink-0" />
                    <span>{iv.notes}</span>
                  </div>
                )}

                {/* Row 3: ai tạo */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50 dark:border-slate-700">
                  <StatusIcon size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-400">
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
