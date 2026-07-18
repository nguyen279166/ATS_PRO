import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CalendarPlus,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
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

interface CandidateInterviewsProps {
  candidateId: string;
}

const STATUS_CONFIG = {
  Scheduled: {
    icon: Clock,
    className: "sahara-status sahara-status-interviewing",
  },
  Done: {
    icon: CheckCircle,
    className: "sahara-status sahara-status-hired",
  },
  Cancelled: {
    icon: XCircle,
    className: "sahara-status sahara-status-rejected",
  },
};

const formatInterviewDate = (dateValue: string) =>
  new Date(dateValue).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CandidateInterviews({
  candidateId,
}: CandidateInterviewsProps) {
  const headingId = useId();
  const formId = useId();
  const scheduledAtId = useId();
  const locationId = useId();
  const notesId = useId();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = localStorage.getItem("token_lay_duoc");
  const headers = useMemo(
    () => ({ Authorization: "Bearer " + token }),
    [token],
  );

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await axios.get(
        API_BASE_URL + "/api/interviews/" + candidateId,
        { headers },
      );
      setInterviews(response.data);
    } catch {
      const message = "Lỗi khi tải lịch phỏng vấn";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [candidateId, headers]);

  useEffect(() => {
    void fetchInterviews();
  }, [fetchInterviews]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduledAt || submitting) return;

    setSubmitting(true);
    try {
      const response = await axios.post(
        API_BASE_URL + "/api/interviews",
        { candidateId, scheduledAt, location, notes },
        { headers },
      );
      setInterviews((current) => [...current, response.data]);
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
    if (updatingStatusId) return;

    setUpdatingStatusId(id);
    try {
      const response = await axios.put(
        API_BASE_URL + "/api/interviews/" + id,
        { status },
        { headers },
      );
      setInterviews((current) =>
        current.map((interview) =>
          interview.id === id ? response.data : interview,
        ),
      );
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId || !window.confirm("Xóa lịch phỏng vấn này?")) return;

    setDeletingId(id);
    try {
      await axios.delete(API_BASE_URL + "/api/interviews/" + id, { headers });
      setInterviews((current) =>
        current.filter((interview) => interview.id !== id),
      );
      toast.success("Đã xóa lịch phỏng vấn");
    } catch {
      toast.error("Lỗi khi xóa lịch phỏng vấn");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className='flex flex-col gap-4' aria-labelledby={headingId}>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h4 id={headingId} className='font-black text-[var(--color-text)]'>
          Lịch phỏng vấn ({interviews.length})
        </h4>
        <button
          type='button'
          onClick={() => setShowForm((current) => !current)}
          className='sahara-button px-3 text-sm'
          aria-expanded={showForm}
          aria-controls={formId}
        >
          <CalendarPlus size={17} aria-hidden='true' />
          {showForm ? "Ẩn biểu mẫu" : "Thêm lịch"}
        </button>
      </div>

      {showForm && (
        <form
          id={formId}
          onSubmit={handleAdd}
          className='sahara-card-soft flex flex-col gap-4 p-4'
        >
          <div>
            <label
              htmlFor={scheduledAtId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Ngày giờ phỏng vấn
              <span className='text-[var(--color-danger)]'> *</span>
            </label>
            <input
              id={scheduledAtId}
              type='datetime-local'
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              autoFocus
              className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
            />
          </div>

          <div>
            <label
              htmlFor={locationId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Địa điểm hoặc link cuộc họp
            </label>
            <input
              id={locationId}
              type='text'
              placeholder='Ví dụ: Phòng họp A3 hoặc link Google Meet'
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={300}
              className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
            />
          </div>

          <div>
            <label
              htmlFor={notesId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Ghi chú chuẩn bị
            </label>
            <textarea
              id={notesId}
              placeholder='Nội dung cần chuẩn bị, câu hỏi...'
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={5000}
              className='sahara-input w-full resize-y px-3 py-2 text-base sm:text-sm'
            />
          </div>

          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className='sahara-button-secondary px-4 text-sm disabled:opacity-50'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={submitting}
              className='sahara-button px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60'
            >
              {submitting && (
                <Loader2
                  size={17}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              )}
              {submitting ? "Đang lưu" : "Lưu lịch"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          className='flex min-h-32 items-center justify-center text-[var(--color-primary)]'
          role='status'
        >
          <Loader2
            size={28}
            className='animate-spin motion-reduce:animate-none'
            aria-hidden='true'
          />
          <span className='sr-only'>Đang tải lịch phỏng vấn</span>
        </div>
      ) : loadError ? (
        <div
          className='flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-danger)] p-4 text-center'
          role='alert'
        >
          <p className='text-sm font-semibold text-[var(--color-danger)]'>
            {loadError}
          </p>
          <button
            type='button'
            onClick={() => void fetchInterviews()}
            className='sahara-button-secondary px-4 text-sm'
          >
            <RefreshCw size={17} aria-hidden='true' />
            Thử lại
          </button>
        </div>
      ) : interviews.length === 0 ? (
        <p
          className='rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]'
          role='status'
        >
          Chưa có lịch phỏng vấn nào.
        </p>
      ) : (
        <ul className='flex flex-col gap-3'>
          {interviews.map((interview) => {
            const statusConfig = STATUS_CONFIG[interview.status];
            const StatusIcon = statusConfig.icon;
            const updating = updatingStatusId === interview.id;
            const deleting = deletingId === interview.id;
            const statusId = "interview-status-" + interview.id;

            return (
              <li
                key={interview.id}
                className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4'
              >
                <article className='flex flex-col gap-3'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='min-w-0'>
                      <time
                        dateTime={interview.scheduledAt}
                        className='text-sm font-bold tabular-nums text-[var(--color-text)]'
                      >
                        {formatInterviewDate(interview.scheduledAt)}
                      </time>
                      {interview.location && (
                        <div className='mt-1 flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]'>
                          <MapPin
                            size={14}
                            className='mt-0.5 shrink-0'
                            aria-hidden='true'
                          />
                          <span className='break-all'>{interview.location}</span>
                        </div>
                      )}
                    </div>

                    <div className='flex items-end gap-2 sm:shrink-0'>
                      <div className='min-w-0 flex-1 sm:w-36'>
                        <label
                          htmlFor={statusId}
                          className='mb-1 block text-xs font-bold text-[var(--color-text-muted)]'
                        >
                          Trạng thái
                        </label>
                        <select
                          id={statusId}
                          value={interview.status}
                          onChange={(event) =>
                            void handleStatusChange(
                              interview.id,
                              event.target.value,
                            )
                          }
                          disabled={updatingStatusId !== null || deletingId !== null}
                          className={
                            statusConfig.className +
                            " min-h-11 w-full cursor-pointer px-3 disabled:cursor-not-allowed disabled:opacity-50"
                          }
                        >
                          <option value='Scheduled'>Đã lên lịch</option>
                          <option value='Done'>Đã xong</option>
                          <option value='Cancelled'>Đã hủy</option>
                        </select>
                      </div>
                      <button
                        type='button'
                        onClick={() => void handleDelete(interview.id)}
                        disabled={deletingId !== null || updatingStatusId !== null}
                        className='sahara-icon-button shrink-0 text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label='Xóa lịch phỏng vấn'
                      >
                        {deleting ? (
                          <Loader2
                            size={17}
                            className='animate-spin motion-reduce:animate-none'
                            aria-hidden='true'
                          />
                        ) : (
                          <Trash2 size={17} aria-hidden='true' />
                        )}
                      </button>
                    </div>
                  </div>

                  {interview.notes && (
                    <div className='flex items-start gap-2 text-sm text-[var(--color-text-muted)]'>
                      <FileText
                        size={15}
                        className='mt-0.5 shrink-0'
                        aria-hidden='true'
                      />
                      <span className='whitespace-pre-wrap break-words'>
                        {interview.notes}
                      </span>
                    </div>
                  )}

                  <div className='flex items-center gap-2 border-t border-[var(--color-border)] pt-2'>
                    {updating ? (
                      <Loader2
                        size={14}
                        className='animate-spin text-[var(--color-primary)] motion-reduce:animate-none'
                        aria-hidden='true'
                      />
                    ) : (
                      <StatusIcon
                        size={14}
                        className='text-[var(--color-text-muted)]'
                        aria-hidden='true'
                      />
                    )}
                    <span className='text-xs text-[var(--color-text-muted)]'>
                      {updating
                        ? "Đang cập nhật trạng thái"
                        : "Tạo bởi " + interview.creator.fullName}
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
