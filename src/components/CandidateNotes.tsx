import { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "react-toastify";

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

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const headers = { Authorization: `Bearer ${token}` };

  // Lấy danh sách notes
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/notes/${candidateId}`, { headers });
      setNotes(res.data);
    } catch {
      toast.error("Lỗi khi tải ghi chú");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [candidateId]);

  // Thêm note mới
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${baseUrl}/api/notes`,
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
        `${baseUrl}/api/notes/${noteId}`,
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
      await axios.delete(`${baseUrl}/api/notes/${noteId}`, { headers });
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Ghi chú</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{candidateName}</p>
        </div>
        <span className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">
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
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Danh sách notes */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
          Chưa có ghi chú nào. Thêm ghi chú đầu tiên!
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 transition-all hover:border-slate-200 dark:hover:border-slate-500"
            >
              {/* Header của mỗi note */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {note.user.avatar ? (
                    <img src={note.user.avatar} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {note.user.fullName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {note.user.fullName}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(note.createdAt)}
                    {note.updatedAt !== note.createdAt && " (đã sửa)"}
                  </span>
                </div>

                {/* Nút sửa/xóa, hiện khi hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
                    className="flex-1 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-white rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
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
