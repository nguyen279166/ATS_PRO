import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import axios from "axios";
import {
  Check,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/env";
import Avatar from "./Avatar";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; avatar?: string };
}

interface CandidateNotesProps {
  candidateId: string;
  candidateName: string;
}

const formatNoteDate = (dateValue: string) =>
  new Date(dateValue).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CandidateNotes({
  candidateId,
  candidateName,
}: CandidateNotesProps) {
  const headingId = useId();
  const newNoteId = useId();
  const noteHelpId = useId();
  const token = localStorage.getItem("token_lay_duoc");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = useMemo(
    () => ({ Authorization: "Bearer " + token }),
    [token],
  );

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await axios.get(
        API_BASE_URL + "/api/notes/" + candidateId,
        { headers },
      );
      setNotes(response.data);
    } catch {
      const message = "Lỗi khi tải ghi chú";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [candidateId, headers]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newNote.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await axios.post(
        API_BASE_URL + "/api/notes",
        { candidateId, content: newNote.trim() },
        { headers },
      );
      setNotes((current) => [response.data, ...current]);
      setNewNote("");
      toast.success("Đã thêm ghi chú!");
    } catch {
      toast.error("Lỗi khi thêm ghi chú");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditError(null);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) {
      setEditError("Nội dung ghi chú không được để trống.");
      return;
    }

    setSavingEditId(noteId);
    setEditError(null);
    try {
      const response = await axios.put(
        API_BASE_URL + "/api/notes/" + noteId,
        { content: editContent.trim() },
        { headers },
      );
      setNotes((current) =>
        current.map((note) => (note.id === noteId ? response.data : note)),
      );
      setEditingId(null);
      toast.success("Đã cập nhật ghi chú!");
    } catch {
      toast.error("Lỗi khi sửa ghi chú");
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (deletingId || !window.confirm("Xóa ghi chú này?")) return;

    setDeletingId(noteId);
    try {
      await axios.delete(API_BASE_URL + "/api/notes/" + noteId, { headers });
      setNotes((current) => current.filter((note) => note.id !== noteId));
      toast.success("Đã xóa ghi chú!");
    } catch {
      toast.error("Lỗi khi xóa ghi chú");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className='sahara-card p-4 sm:p-6'
      aria-labelledby={headingId}
    >
      <div className='mb-5 flex flex-wrap items-center gap-3'>
        <div className='rounded-lg bg-[var(--color-surface-strong)] p-2 text-[var(--color-primary)]'>
          <MessageSquare size={20} aria-hidden='true' />
        </div>
        <div className='min-w-0'>
          <h3 id={headingId} className='text-lg font-black text-[var(--color-text)]'>
            Ghi chú
          </h3>
          <p className='truncate text-sm text-[var(--color-text-muted)]'>
            {candidateName}
          </p>
        </div>
        <span
          className='ml-auto rounded-full bg-[var(--color-surface-strong)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]'
          aria-live='polite'
        >
          {notes.length} ghi chú
        </span>
      </div>

      <form onSubmit={handleAddNote} className='mb-5'>
        <label
          htmlFor={newNoteId}
          className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
        >
          Thêm ghi chú
        </label>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <textarea
            id={newNoteId}
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder='Nhập nội dung ghi chú...'
            rows={2}
            maxLength={5000}
            aria-describedby={noteHelpId}
            className='sahara-input min-h-24 flex-1 resize-y px-4 py-3 text-base sm:text-sm'
          />
          <button
            type='submit'
            disabled={submitting || !newNote.trim()}
            className='sahara-button shrink-0 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? (
              <Loader2
                size={18}
                className='animate-spin motion-reduce:animate-none'
                aria-hidden='true'
              />
            ) : (
              <Send size={18} aria-hidden='true' />
            )}
            {submitting ? "Đang gửi" : "Gửi"}
          </button>
        </div>
        <p
          id={noteHelpId}
          className='mt-1.5 text-xs text-[var(--color-text-muted)]'
        >
          Nhấn Enter để gửi, Shift + Enter để xuống dòng.
        </p>
      </form>

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
          <span className='sr-only'>Đang tải ghi chú</span>
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
            onClick={() => void fetchNotes()}
            className='sahara-button-secondary px-4 text-sm'
          >
            <RefreshCw size={17} aria-hidden='true' />
            Thử lại
          </button>
        </div>
      ) : notes.length === 0 ? (
        <p
          className='rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]'
          role='status'
        >
          Chưa có ghi chú nào. Hãy thêm ghi chú đầu tiên.
        </p>
      ) : (
        <ul className='max-h-[28rem] space-y-3 overflow-y-auto pr-1'>
          {notes.map((note) => {
            const editId = "edit-note-" + note.id;
            const deleting = deletingId === note.id;
            const saving = savingEditId === note.id;

            return (
              <li
                key={note.id}
                className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4'
              >
                <article>
                  <div className='mb-3 flex flex-wrap items-start justify-between gap-2'>
                    <div className='flex min-w-0 flex-wrap items-center gap-2'>
                      <Avatar
                        name={note.user.fullName}
                        src={note.user.avatar}
                        alt=''
                        className='h-7 w-7 text-[10px]'
                      />
                      <span className='text-xs font-bold text-[var(--color-text)]'>
                        {note.user.fullName}
                      </span>
                      <time
                        dateTime={note.createdAt}
                        className='text-xs tabular-nums text-[var(--color-text-muted)]'
                      >
                        {formatNoteDate(note.createdAt)}
                        {note.updatedAt !== note.createdAt && " (đã sửa)"}
                      </time>
                    </div>

                    <div className='flex gap-1'>
                      <button
                        type='button'
                        onClick={() => startEdit(note)}
                        disabled={savingEditId !== null || deletingId !== null}
                        className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label={"Sửa ghi chú của " + note.user.fullName}
                      >
                        <Pencil size={16} aria-hidden='true' />
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleDelete(note.id)}
                        disabled={savingEditId !== null || deletingId !== null}
                        className='sahara-icon-button text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label={"Xóa ghi chú của " + note.user.fullName}
                      >
                        {deleting ? (
                          <Loader2
                            size={16}
                            className='animate-spin motion-reduce:animate-none'
                            aria-hidden='true'
                          />
                        ) : (
                          <Trash2 size={16} aria-hidden='true' />
                        )}
                      </button>
                    </div>
                  </div>

                  {editingId === note.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveEdit(note.id);
                      }}
                      className='space-y-2'
                    >
                      <label
                        htmlFor={editId}
                        className='block text-xs font-bold text-[var(--color-text)]'
                      >
                        Chỉnh sửa nội dung ghi chú
                      </label>
                      <textarea
                        id={editId}
                        value={editContent}
                        onChange={(event) => {
                          setEditContent(event.target.value);
                          if (editError) setEditError(null);
                        }}
                        autoFocus
                        rows={3}
                        maxLength={5000}
                        aria-invalid={Boolean(editError)}
                        className='sahara-input w-full resize-y px-3 py-2 text-base sm:text-sm'
                      />
                      {editError && (
                        <p
                          className='text-sm font-semibold text-[var(--color-danger)]'
                          role='alert'
                        >
                          {editError}
                        </p>
                      )}
                      <div className='flex flex-wrap justify-end gap-2'>
                        <button
                          type='button'
                          onClick={() => {
                            setEditingId(null);
                            setEditError(null);
                          }}
                          disabled={saving}
                          className='sahara-button-secondary px-3 text-sm disabled:opacity-50'
                        >
                          <X size={16} aria-hidden='true' />
                          Hủy
                        </button>
                        <button
                          type='submit'
                          disabled={saving}
                          className='sahara-button px-3 text-sm disabled:opacity-50'
                        >
                          {saving ? (
                            <Loader2
                              size={16}
                              className='animate-spin motion-reduce:animate-none'
                              aria-hidden='true'
                            />
                          ) : (
                            <Check size={16} aria-hidden='true' />
                          )}
                          {saving ? "Đang lưu" : "Lưu"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className='whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-text)]'>
                      {note.content}
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
