import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  Sparkles,
  Eye,
  X,
} from "lucide-react";
import { apiClient, isApiError } from "../api/client";
import { resolveMediaUrl } from "../utils/media";

interface Props {
  candidateId: string;
  candidateName: string;
  initialCvUrl?: string | null;
  initialCvFileName?: string | null;
  onCvChange?: (updates: {
    cvUrl: string | null;
    cvFileName: string | null;
  }) => void;
}

type CvUploadResponse = {
  cvUrl: string | null;
  cvFileName?: string | null;
  cvIndex?: {
    indexed: boolean;
    chunks?: number;
    reason?: string;
    extractionProvider?: string;
    embeddingProvider?: string;
    embeddingModel?: string;
  };
};

type CvIndexStatus = CvUploadResponse["cvIndex"] | null;
type CvPreview = { url: string; kind: "pdf" | "image" };

export default function CandidateCV({
  candidateId,
  candidateName,
  initialCvUrl,
  initialCvFileName,
  onCvChange,
}: Props) {
  const [cvUrl, setCvUrl] = useState<string | null>(initialCvUrl ?? null);
  const [cvFileName, setCvFileName] = useState<string | null>(
    initialCvFileName ?? null,
  );
  const [cvIndexStatus, setCvIndexStatus] = useState<CvIndexStatus>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCvUrl(initialCvUrl ?? null);
    setCvFileName(initialCvFileName ?? null);
  }, [candidateId, initialCvUrl, initialCvFileName]);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const detectFileExtension = async (blob: Blob, contentType?: string) => {
    const fromUrl = cvUrl?.match(/\.(pdf|docx?|jpe?g|png)(?=($|[?#]))/i)?.[1];
    if (fromUrl) return fromUrl.toLowerCase();

    const normalizedType = (contentType || blob.type || "").toLowerCase();
    if (normalizedType.includes("png")) return "png";
    if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) return "jpg";
    if (normalizedType.includes("pdf")) return "pdf";
    if (normalizedType.includes("officedocument.wordprocessingml.document")) return "docx";
    if (normalizedType.includes("msword")) return "doc";

    const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
    if (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    ) return "doc";

    return "bin";
  };

  const getDownloadName = async (blob: Blob, contentType?: string) => {
    const ext = await detectFileExtension(blob, contentType);
    if (cvFileName) {
      const hasKnownExt = /\.(pdf|docx?|jpe?g|png)$/i.test(cvFileName);
      return hasKnownExt ? cvFileName : `${cvFileName}.${ext}`;
    }

    const safeName = candidateName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return `cv-${safeName || "candidate"}.${ext}`;
  };

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

      const res = await apiClient.post<CvUploadResponse>(
        `/api/candidates/${candidateId}/cv`,
        formData,
      );
      setCvUrl(res.data.cvUrl);
      const nextFileName = res.data.cvFileName ?? file.name;
      setCvFileName(nextFileName);
      onCvChange?.({
        cvUrl: res.data.cvUrl,
        cvFileName: nextFileName,
      });
      if (res.data.cvIndex?.indexed) {
        setCvIndexStatus(res.data.cvIndex);
        toast.success(`Upload CV và index AI thành công (${res.data.cvIndex.chunks} đoạn)`);
      } else if (res.data.cvIndex?.reason) {
        setCvIndexStatus(res.data.cvIndex);
        toast.warning(
          `Upload CV thành công, nhưng AI chưa đọc được file này: ${res.data.cvIndex.reason}`,
        );
      } else {
        setCvIndexStatus(null);
        toast.success("Upload CV thành công!");
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        toast.error(err.response?.data?.error || "Lỗi upload CV");
      } else {
        toast.error("Lỗi upload CV");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await apiClient.post<CvUploadResponse>(
        `/api/candidates/${candidateId}/cv/reindex`,
      );
      if (res.data.cvIndex?.indexed) {
        setCvIndexStatus(res.data.cvIndex);
        toast.success(`AI da index lai CV (${res.data.cvIndex.chunks} doan)`);
      } else {
        setCvIndexStatus(res.data.cvIndex ?? null);
        toast.warning(
          res.data.cvIndex?.reason || "Khong index duoc CV cho AI",
        );
      }
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.response?.data?.error || "Khong index lai duoc CV"
        : "Khong index lai duoc CV";
      toast.error(message);
    } finally {
      setReindexing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa CV của ứng viên này?")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/candidates/${candidateId}/cv`);
      setCvUrl(null);
      setCvFileName(null);
      setCvIndexStatus(null);
      onCvChange?.({ cvUrl: null, cvFileName: null });
      toast.success("Đã xóa CV!");
    } catch {
      toast.error("Lỗi khi xóa CV");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    const href = resolveMediaUrl(cvUrl);
    if (!href) return;

    try {
      const response = await axios.get(href, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = await getDownloadName(
        response.data,
        response.headers["content-type"],
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
      toast.error("Khong tai duoc CV truc tiep, da mo file trong tab moi");
    }
  };

  const handlePreview = async () => {
    const href = resolveMediaUrl(cvUrl);
    if (!href) return;

    setPreviewing(true);
    try {
      const response = await axios.get<Blob>(href, { responseType: "blob" });
      const ext = await detectFileExtension(
        response.data,
        response.headers["content-type"],
      );

      if (ext !== "pdf" && !["jpg", "jpeg", "png"].includes(ext)) {
        toast.info("Preview hỗ trợ PDF, JPG và PNG. DOC/DOCX cần tải xuống để xem.");
        return;
      }

      setPreview({
        url: URL.createObjectURL(response.data),
        kind: ext === "pdf" ? "pdf" : "image",
      });
    } catch {
      toast.error("Không tải được bản preview CV");
    } finally {
      setPreviewing(false);
    }
  };

  const fileName = cvFileName || cvUrl?.split("/").pop() || "CV";

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#7d6f62]">
        CV / Hồ sơ
      </h4>

      {cvUrl ? (
        /* Đã có CV */
        <div className="flex items-center gap-3 rounded-lg border border-[#d8c8b5] bg-[#fff7eb] p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f4dfbd]">
            <FileText size={20} className="text-[#8a4518]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold text-[#3a302a]">{fileName}</p>
            <p className="text-xs text-[#9a7655]">PDF/DOCX · JPG/PNG (AI OCR qua Gemini)</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-lg p-2 text-[#8a4518] transition-colors hover:bg-[#f4dfbd]"
              title="Xem trước"
              disabled={previewing}
            >
              {previewing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Eye size={16} />
              )}
            </button>
            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg p-2 text-[#8a4518] transition-colors hover:bg-[#f4dfbd]"
              title="Tải xuống"
            >
              <Download size={16} />
            </button>
            {/* Re-upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg p-2 text-[#9a7655] transition-colors hover:bg-[#f4dfbd] hover:text-[#8a4518]"
              title="Upload lại"
              disabled={uploading}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </button>
            {/* Delete */}
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-[#9a7655] transition-colors hover:bg-[#f2ded4] hover:text-[#8c3c3c]"
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
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d8c8b5] p-6 transition-all hover:border-[#c2652a] hover:bg-[#fff7eb]"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-[#c2652a]" />
          ) : (
            <Upload size={24} className="text-[#9a7655] transition-colors group-hover:text-[#c2652a]" />
          )}
          <span className="text-sm font-semibold text-[#7d6f62] transition-colors group-hover:text-[#8a4518]">
            {uploading ? "Đang upload..." : `Upload CV cho ${candidateName}`}
          </span>
          <span className="text-xs text-[#9a7655]">PDF, DOCX, JPG, PNG · AI doc CV qua Gemini OCR · Tối đa 10MB</span>
        </button>
      )}

      {cvUrl && cvIndexStatus?.indexed && (
        <div className="mt-3 rounded-lg border border-[#b9c79f] bg-[#f2f6df] px-3 py-2 text-xs font-semibold text-[#53612d]">
          AI đã index CV này ({cvIndexStatus.chunks || 0} đoạn)
          {cvIndexStatus.embeddingProvider
            ? ` bằng ${cvIndexStatus.embeddingProvider}/${cvIndexStatus.embeddingModel || "default"}`
            : ""}
          . Bạn có thể sang tab AI để hỏi.
        </div>
      )}

      {cvUrl && cvIndexStatus && !cvIndexStatus.indexed && (
        <div className="mt-3 rounded-lg border border-[#d7a184] bg-[#fff0e8] px-3 py-2 text-xs font-semibold text-[#8c3c3c]">
          CV đã lưu, nhưng AI chưa index được: {cvIndexStatus.reason || "không tạo được embedding"}.
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing}
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-[#d7a184] bg-white px-2 py-1 text-[11px] font-bold text-[#8a4518] hover:bg-[#fff7eb] disabled:opacity-60"
          >
            {reindexing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Index lại AI
          </button>
        </div>
      )}

      {cvUrl && !cvIndexStatus && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#d8c8b5] bg-[#fff7eb] px-3 py-2 text-xs font-semibold text-[#7d6f62]">
          <span>Chua biet trang thai index AI cua CV nay.</span>
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing}
            className="inline-flex items-center gap-1 rounded-md border border-[#d8c8b5] bg-white px-2 py-1 text-[11px] font-bold text-[#8a4518] hover:bg-[#fffaf2] disabled:opacity-60"
          >
            {reindexing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Index AI
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleUpload}
      />

      {preview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-[#fffaf2] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#d8c8b5] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#3a302a]">
                  {fileName}
                </p>
                <p className="text-xs text-[#9a7655]">Bản xem trước CV</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-2 text-[#7d6f62] hover:bg-[#f4dfbd] hover:text-[#3a302a]"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#e8ded0] p-3">
              {preview.kind === "pdf" ? (
                <iframe
                  src={preview.url}
                  title={`CV ${candidateName}`}
                  className="h-full w-full rounded bg-white"
                />
              ) : (
                <img
                  src={preview.url}
                  alt={`CV ${candidateName}`}
                  className="max-h-full max-w-full rounded object-contain shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
