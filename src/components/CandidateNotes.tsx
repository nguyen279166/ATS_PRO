import { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/env";

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

export default function CandidateNotes({ candidateId, candidateName }: CandidateNotesProps) {
  const token = localStorage.getItem("token_lay_duoc");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Lấy danh sách notes
  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notes/${candidateId}`, { headers });
      setNotes(res.data);
    } catch {
      toast.error("Lỗi khi tải ghi chú");
    } finally {
      setLoading(false);
    }
  }, [candidateId, headers]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Thêm note mới
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/notes`,
        { candidateId, content: newNote.trim() },
        { headers }
      );
      setNotes([res.data, ...notes]); // Thêm vào đầu danh sách
      setNewNote("");
      toast.success("Đã thêm ghi chú!");
    } catch {
      toast.error("Lỗi khi thêm ghi chú");
    } finally {
      setSubmitting(false);
    }
  };

  // Bắt đầu sửa
  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  // Lưu sửa
  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/notes/${noteId}`,
        { content: editContent.trim() },
        { headers }
      );
      setNotes(notes.map((n) => (n.id === noteId ? res.data : n)));
      setEditingId(null);
      toast.success("Đã cập nhật ghi chú!");
    } catch {
      toast.error("Lỗi khi sửa ghi chú");
    }
  };

  // Xóa note
  const handleDelete = async (noteId: string) => {
    if (!window.confirm("Xóa ghi chú này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/notes/${noteId}`, { headers });
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Đã xóa ghi chú!");
    } catch {
      toast.error("Lỗi khi xóa ghi chú");
    }
  };

  // Format thời gian
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="sahara-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-lg bg-[#f4dfbd] p-2 text-[#8a4518]">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#3a302a]">Ghi chú</h3>
          <p className="text-sm text-[#7d6f62]">{candidateName}</p>
        </div>
        <span className="ml-auto rounded-full bg-[#f4dfbd] px-2.5 py-1 text-xs font-bold text-[#8a4518]">
          {notes.length} ghi chú
        </span>
      </div>

      {/* Form thêm note */}
      <form onSubmit={handleAddNote} className="mb-5">
        <div className="flex gap-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddNote(e);
              }
            }}
            placeholder="Nhập ghi chú... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={2}
            className="sahara-input flex-1 resize-none px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !newNote.trim()}
            className="sahara-button self-end px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Danh sách notes */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#c2652a]" />
        </div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#9a7655]">
          Chưa có ghi chú nào. Thêm ghi chú đầu tiên!
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border border-[#d8c8b5] bg-[#fff7eb] p-4 transition-all hover:border-[#c2652a]"
            >
              {/* Header của mỗi note */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {note.user.avatar ? (
                    <img src={note.user.avatar} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4dfbd] text-xs font-bold text-[#8a4518]">
                      {note.user.fullName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-[#5b4a3a]">
                    {note.user.fullName}
                  </span>
                  <span className="text-xs text-[#9a7655]">
                    {formatDate(note.createdAt)}
                    {note.updatedAt !== note.createdAt && " (đã sửa)"}
                  </span>
                </div>

                {/* Nút sửa/xóa, hiện khi hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="rounded-lg p-1.5 text-[#9a7655] transition-colors hover:bg-[#f4dfbd] hover:text-[#8a4518]"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="rounded-lg p-1.5 text-[#9a7655] transition-colors hover:bg-[#f2ded4] hover:text-[#8c3c3c]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Nội dung note / chế độ sửa */}
              {editingId === note.id ? (
                <div className="flex gap-2 mt-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                    rows={2}
                    className="sahara-input flex-1 resize-none px-3 py-2 text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="rounded-lg bg-[#c2652a] p-1.5 text-white transition-colors hover:bg-[#8a4518]"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-[#efe2cc] p-1.5 text-[#5b4a3a] transition-colors hover:bg-[#d8c8b5]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3a302a]">
                  {note.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
