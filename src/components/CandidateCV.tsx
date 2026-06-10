import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";

interface Props {
  candidateId: string;
  candidateName: string;
  initialCvUrl?: string | null;
}

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function CandidateCV({ candidateId, candidateName, initialCvUrl }: Props) {
  const [cvUrl, setCvUrl] = useState<string | null>(initialCvUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token_lay_duoc");
  const headers = { Authorization: `Bearer ${token}` };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate phía client
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext || "")) {
      toast.error("Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn, tối đa 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await axios.post(
        `${baseUrl}/api/candidates/${candidateId}/cv`,
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } }
      );
      setCvUrl(res.data.cvUrl);
      toast.success("Upload CV thành công!");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Lỗi upload CV");
      } else {
        toast.error("Lỗi upload CV");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa CV của ứng viên này?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseUrl}/api/candidates/${candidateId}/cv`, { headers });
      setCvUrl(null);
      toast.success("Đã xóa CV!");
    } catch {
      toast.error("Lỗi khi xóa CV");
    } finally {
      setDeleting(false);
    }
  };

  const fileName = cvUrl?.split("/").pop() || "CV";

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
        CV / Hồ sơ
      </h4>

      {cvUrl ? (
        /* Đã có CV */
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{fileName}</p>
            <p className="text-xs text-slate-400">PDF / DOC / DOCX / JPG / PNG</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download */}
            <a
              href={`${baseUrl}${cvUrl}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
              title="Tải xuống"
            >
              <Download size={16} />
            </a>
            {/* Re-upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Upload lại"
              disabled={uploading}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </button>
            {/* Delete */}
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Xóa CV"
              disabled={deleting}
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        </div>
      ) : (
        /* Chưa có CV — drop zone */
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-blue-500" />
          ) : (
            <Upload size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          )}
          <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
            {uploading ? "Đang upload..." : `Upload CV cho ${candidateName}`}
          </span>
          <span className="text-xs text-slate-400">PDF, DOC, DOCX, JPG, PNG · Tối đa 10MB</span>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
