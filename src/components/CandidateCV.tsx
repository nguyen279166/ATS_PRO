import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiClient, isApiError } from "../api/client";
import { resolveMediaUrl } from "../utils/media";
import Dialog from "./ui/Dialog";

interface CandidateCVProps {
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
const asHeaderString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export default function CandidateCV({
  candidateId,
  candidateName,
  initialCvUrl,
  initialCvFileName,
  onCvChange,
}: CandidateCVProps) {
  const headingId = useId();
  const fileHelpId = useId();
  const previewTitleId = useId();
  const [cvUrl, setCvUrl] = useState<string | null>(initialCvUrl ?? null);
  const [cvFileName, setCvFileName] = useState<string | null>(
    initialCvFileName ?? null,
  );
  const [cvIndexStatus, setCvIndexStatus] = useState<CvIndexStatus>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const closePreview = useCallback(() => setPreview(null), []);

  const detectFileExtension = async (blob: Blob, contentType?: string) => {
    const fromUrl = cvUrl?.match(/\.(pdf|docx?|jpe?g|png)(?=($|[?#]))/i)?.[1];
    if (fromUrl) return fromUrl.toLowerCase();

    const normalizedType = (contentType || blob.type || "").toLowerCase();
    if (normalizedType.includes("png")) return "png";
    if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) {
      return "jpg";
    }
    if (normalizedType.includes("pdf")) return "pdf";
    if (
      normalizedType.includes(
        "officedocument.wordprocessingml.document",
      )
    ) {
      return "docx";
    }
    if (normalizedType.includes("msword")) return "doc";

    const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "png";
    }
    if (
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    ) {
      return "jpg";
    }
    if (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return "pdf";
    }
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
    if (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    ) {
      return "doc";
    }

    return "bin";
  };

  const getDownloadName = async (blob: Blob, contentType?: string) => {
    const extension = await detectFileExtension(blob, contentType);
    if (cvFileName) {
      const hasKnownExtension = /\.(pdf|docx?|jpe?g|png)$/i.test(cvFileName);
      return hasKnownExtension
        ? cvFileName
        : cvFileName + "." + extension;
    }

    const safeName = candidateName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return "cv-" + (safeName || "candidate") + "." + extension;
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (
      !["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(
        extension || "",
      )
    ) {
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

      const response = await apiClient.post<CvUploadResponse>(
        "/api/candidates/" + candidateId + "/cv",
        formData,
      );
      setCvUrl(response.data.cvUrl);
      const nextFileName = response.data.cvFileName ?? file.name;
      setCvFileName(nextFileName);
      onCvChange?.({
        cvUrl: response.data.cvUrl,
        cvFileName: nextFileName,
      });

      if (response.data.cvIndex?.indexed) {
        setCvIndexStatus(response.data.cvIndex);
        toast.success(
          "Upload CV và index AI thành công (" +
            response.data.cvIndex.chunks +
            " đoạn)",
        );
      } else if (response.data.cvIndex?.reason) {
        setCvIndexStatus(response.data.cvIndex);
        toast.warning(
          "Upload CV thành công, nhưng AI chưa đọc được file này: " +
            response.data.cvIndex.reason,
        );
      } else {
        setCvIndexStatus(null);
        toast.success("Upload CV thành công!");
      }
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error(error.response?.data?.error || "Lỗi upload CV");
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
      const response = await apiClient.post<CvUploadResponse>(
        "/api/candidates/" + candidateId + "/cv/reindex",
      );
      if (response.data.cvIndex?.indexed) {
        setCvIndexStatus(response.data.cvIndex);
        toast.success(
          "AI da index lai CV (" +
            response.data.cvIndex.chunks +
            " doan)",
        );
      } else {
        setCvIndexStatus(response.data.cvIndex ?? null);
        toast.warning(
          response.data.cvIndex?.reason || "Không thể lập chỉ mục CV cho AI",
        );
      }
    } catch (error: unknown) {
      const message = isApiError(error)
        ? error.response?.data?.error || "Không thể lập lại chỉ mục CV"
        : "Không thể lập lại chỉ mục CV";
      toast.error(message);
    } finally {
      setReindexing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa CV của ứng viên này?")) return;

    setDeleting(true);
    try {
      await apiClient.delete("/api/candidates/" + candidateId + "/cv");
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
    if (!href || downloading) return;

    setDownloading(true);
    try {
      const response = await axios.get(href, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = await getDownloadName(
        response.data,
        asHeaderString(response.headers["content-type"]),
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
      toast.error("Không thể tải CV trực tiếp; đã mở file trong tab mới");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    const href = resolveMediaUrl(cvUrl);
    if (!href) return;

    setPreviewing(true);
    try {
      const response = await axios.get<Blob>(href, { responseType: "blob" });
      const extension = await detectFileExtension(
        response.data,
        asHeaderString(response.headers["content-type"]),
      );

      if (
        extension !== "pdf" &&
        !["jpg", "jpeg", "png"].includes(extension)
      ) {
        toast.info(
          "Preview hỗ trợ PDF, JPG và PNG. DOC/DOCX cần tải xuống để xem.",
        );
        return;
      }

      setPreview({
        url: URL.createObjectURL(response.data),
        kind: extension === "pdf" ? "pdf" : "image",
      });
    } catch {
      toast.error("Không tải được bản preview CV");
    } finally {
      setPreviewing(false);
    }
  };

  const fileName = cvFileName || cvUrl?.split("/").pop() || "CV";

  return (
    <section className='mt-6' aria-labelledby={headingId}>
      <h4
        id={headingId}
        className='mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]'
      >
        CV / Hồ sơ
      </h4>

      {cvUrl ? (
        <div className='flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 sm:flex-row sm:items-center'>
          <div className='flex min-w-0 items-center gap-3 sm:flex-1'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] text-[var(--color-primary)]'>
              <FileText size={21} aria-hidden='true' />
            </div>
            <div className='min-w-0 flex-1'>
              <p
                className='truncate text-sm font-bold text-[var(--color-text)]'
                title={fileName}
              >
                {fileName}
              </p>
              <p
                id={fileHelpId}
                className='mt-0.5 text-xs text-[var(--color-text-muted)]'
              >
                PDF/DOCX · JPG/PNG · Tối đa 10MB
              </p>
            </div>
          </div>

          <div
            className='grid grid-cols-4 gap-1 sm:flex sm:shrink-0'
            aria-label='Thao tác với CV'
          >
            <button
              type='button'
              onClick={() => void handlePreview()}
              className='sahara-icon-button text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Xem trước CV'
              title='Xem trước'
              disabled={previewing}
            >
              {previewing ? (
                <Loader2
                  size={18}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <Eye size={18} aria-hidden='true' />
              )}
            </button>
            <button
              type='button'
              onClick={() => void handleDownload()}
              className='sahara-icon-button text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Tải CV xuống'
              title='Tải xuống'
              disabled={downloading}
            >
              {downloading ? (
                <Loader2
                  size={18}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <Download size={18} aria-hidden='true' />
              )}
            </button>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Upload CV thay thế'
              title='Upload lại'
              disabled={uploading}
            >
              {uploading ? (
                <Loader2
                  size={18}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <Upload size={18} aria-hidden='true' />
              )}
            </button>
            <button
              type='button'
              onClick={() => void handleDelete()}
              className='sahara-icon-button text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Xóa CV'
              title='Xóa CV'
              disabled={deleting}
            >
              {deleting ? (
                <Loader2
                  size={18}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <Trash2 size={18} aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-describedby={fileHelpId}
          className='group flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-center transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60 sm:p-6'
        >
          {uploading ? (
            <Loader2
              size={26}
              className='animate-spin text-[var(--color-primary)] motion-reduce:animate-none'
              aria-hidden='true'
            />
          ) : (
            <Upload
              size={26}
              className='text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]'
              aria-hidden='true'
            />
          )}
          <span className='text-sm font-bold text-[var(--color-text)]'>
            {uploading
              ? "Đang upload..."
              : "Upload CV cho " + candidateName}
          </span>
          <span
            id={fileHelpId}
            className='max-w-lg text-xs text-[var(--color-text-muted)]'
          >
            PDF, DOC, DOCX, JPG hoặc PNG · Tối đa 10MB
          </span>
        </button>
      )}

      {cvUrl && cvIndexStatus?.indexed && (
        <div
          className='mt-3 rounded-lg border border-[var(--color-secondary)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]'
          role='status'
        >
          AI đã index CV này ({cvIndexStatus.chunks || 0} đoạn)
          {cvIndexStatus.embeddingProvider
            ? " bằng " +
              cvIndexStatus.embeddingProvider +
              "/" +
              (cvIndexStatus.embeddingModel || "default")
            : ""}
          . Bạn có thể sang tab AI để hỏi.
        </div>
      )}

      {cvUrl && cvIndexStatus && !cvIndexStatus.indexed && (
        <div
          className='mt-3 flex flex-col gap-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] px-3 py-3 text-xs font-semibold text-[var(--color-danger)] sm:flex-row sm:items-center sm:justify-between'
          role='alert'
        >
          <span>
            CV đã lưu, nhưng AI chưa index được:{" "}
            {cvIndexStatus.reason || "không tạo được embedding"}.
          </span>
          <button
            type='button'
            onClick={() => void handleReindex()}
            disabled={reindexing}
            className='sahara-button-secondary shrink-0 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60'
          >
            {reindexing ? (
              <Loader2
                size={15}
                className='animate-spin motion-reduce:animate-none'
                aria-hidden='true'
              />
            ) : (
              <Sparkles size={15} aria-hidden='true' />
            )}
            Index lại AI
          </button>
        </div>
      )}

      {cvUrl && !cvIndexStatus && (
        <div
          className='mt-3 flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-3 text-xs font-semibold text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between'
          role='status'
        >
          <span>Chưa biết trạng thái index AI của CV này.</span>
          <button
            type='button'
            onClick={() => void handleReindex()}
            disabled={reindexing}
            className='sahara-button-secondary shrink-0 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60'
          >
            {reindexing ? (
              <Loader2
                size={15}
                className='animate-spin motion-reduce:animate-none'
                aria-hidden='true'
              />
            ) : (
              <Sparkles size={15} aria-hidden='true' />
            )}
            Index AI
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
        className='hidden'
        aria-label='Chọn file CV'
        onChange={(event) => void handleUpload(event)}
      />

      {preview && (
        <Dialog
          labelledBy={previewTitleId}
          onClose={closePreview}
          className='flex h-[calc(100dvh-2rem)] max-w-5xl flex-col overflow-hidden sm:h-[88dvh]'
        >
          <div className='flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3'>
            <div className='min-w-0'>
              <h2
                id={previewTitleId}
                className='truncate text-sm font-bold text-[var(--color-text)]'
              >
                {fileName}
              </h2>
              <p className='text-xs text-[var(--color-text-muted)]'>
                Bản xem trước CV
              </p>
            </div>
            <button
              type='button'
              onClick={closePreview}
              className='sahara-icon-button -mr-2 shrink-0'
              aria-label='Đóng bản xem trước CV'
              title='Đóng'
            >
              <X size={20} aria-hidden='true' />
            </button>
          </div>

          <div className='flex min-h-0 flex-1 items-center justify-center bg-[var(--color-surface-strong)] p-2 sm:p-3'>
            {preview.kind === "pdf" ? (
              <iframe
                src={preview.url}
                title={"CV " + candidateName}
                className='h-full w-full rounded bg-white'
              />
            ) : (
              <img
                src={preview.url}
                alt={"CV " + candidateName}
                className='max-h-full max-w-full rounded object-contain shadow-lg'
              />
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
