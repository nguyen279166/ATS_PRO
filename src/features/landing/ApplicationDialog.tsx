import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Job } from "../../types";
import { JobDescription } from "./JobDescription";
import type { JobApplicationController } from "./useJobApplication";

type ApplicationDialogProps = {
  job: Job;
  application: JobApplicationController;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ApplicationDialog({
  job,
  application,
  onClose,
}: ApplicationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
      style={{
        background:
          "color-mix(in srgb, var(--color-sidebar) 58%, transparent)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        id='job-application-dialog'
        ref={dialogRef}
        className='sahara-card flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden'
        role='dialog'
        aria-modal='true'
        aria-labelledby='application-dialog-title'
        aria-describedby='application-dialog-description'
      >
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] p-4 sm:p-6'>
          <div className='min-w-0'>
            <h2
              id='application-dialog-title'
              className='text-2xl font-black text-[var(--color-text)]'
            >
              Ứng tuyển vị trí
            </h2>
            <p
              id='application-dialog-description'
              className='mt-1 font-bold text-[var(--color-primary)]'
            >
              {job.title}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='sahara-icon-button shrink-0'
            aria-label='Đóng biểu mẫu ứng tuyển'
          >
            <X size={20} aria-hidden='true' />
          </button>
        </div>

        <div className='flex-1 space-y-6 overflow-y-auto p-4 sm:p-6'>
          {job.description && (
            <section aria-labelledby='application-job-description-title'>
              <h3
                id='application-job-description-title'
                className='mb-2 text-base font-bold text-[var(--color-text)]'
              >
                Mô tả công việc
              </h3>
              <div className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4'>
                <JobDescription description={job.description} />
              </div>
            </section>
          )}

          <form
            onSubmit={application.handleSubmit}
            className='space-y-4'
            aria-busy={application.isApplying}
            aria-describedby={
              application.submissionError ? "application-submit-error" : undefined
            }
          >
            <div>
              <label
                htmlFor='application-name'
                className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
              >
                Họ và tên
              </label>
              <input
                ref={nameInputRef}
                id='application-name'
                type='text'
                required
                autoComplete='name'
                value={application.applicantName}
                onChange={(event) => {
                  application.setApplicantName(event.target.value);
                  application.clearSubmissionError();
                }}
                className='sahara-input w-full px-3 text-base'
                placeholder='Nguyễn Văn A'
              />
            </div>

            <div>
              <label
                htmlFor='application-email'
                className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
              >
                Email liên hệ
              </label>
              <input
                id='application-email'
                type='email'
                required
                autoComplete='email'
                value={application.applicantEmail}
                onChange={(event) => {
                  application.setApplicantEmail(event.target.value);
                  application.clearSubmissionError();
                }}
                className='sahara-input w-full px-3 text-base'
                placeholder='nguyenvana@gmail.com'
              />
            </div>

            <div>
              <label
                htmlFor='application-cv'
                className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
              >
                CV / Hồ sơ{" "}
                <span className='font-medium text-[var(--color-text-muted)]'>
                  (không bắt buộc)
                </span>
              </label>
              {application.cvFile ? (
                <div className='flex min-h-14 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-2 pl-3'>
                  <FileText
                    size={18}
                    className='shrink-0 text-[var(--color-primary)]'
                    aria-hidden='true'
                  />
                  <span
                    className='min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-text)]'
                    title={application.cvFile.name}
                  >
                    {application.cvFile.name}
                  </span>
                  <button
                  type='button'
                    onClick={() => {
                      application.clearSelectedFile();
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className='sahara-icon-button shrink-0'
                    aria-label={`Xóa tệp ${application.cvFile.name}`}
                  >
                    <X size={18} aria-hidden='true' />
                  </button>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='flex min-h-14 w-full flex-col items-start gap-1 rounded-lg border-2 border-dashed border-[var(--color-border)] p-3 text-left text-[var(--color-text-muted)] transition-colors duration-150 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)] sm:flex-row sm:items-center sm:gap-3'
                  aria-describedby='application-cv-help'
                >
                  <span className='flex items-center gap-2 text-sm font-bold'>
                    <Upload size={18} aria-hidden='true' />
                    Tải lên CV của bạn
                  </span>
                  <span
                    id='application-cv-help'
                    className='text-xs font-semibold sm:ml-auto'
                  >
                    PDF, DOC, DOCX, JPG hoặc PNG · tối đa 10MB
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                id='application-cv'
                type='file'
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                className='hidden'
                onChange={application.handleFileChange}
              />
            </div>

            {application.submissionError && (
              <p
                id='application-submit-error'
                className='rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] p-3 text-sm font-semibold text-[var(--color-danger)]'
                role='alert'
              >
                {application.submissionError}. Vui lòng kiểm tra thông tin và
                thử lại.
              </p>
            )}

            <div className='flex flex-col-reverse gap-3 pt-4 sm:flex-row'>
              <button
                type='button'
                onClick={onClose}
                className='sahara-button-secondary flex-1 px-4'
              >
                Hủy
              </button>
              <button
                type='submit'
                disabled={application.isApplying}
                className='sahara-button flex-1 px-4 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {application.isApplying && (
                  <LoaderCircle
                    size={18}
                    className='animate-spin motion-reduce:animate-none'
                    aria-hidden='true'
                  />
                )}
                {application.isApplying ? "Đang gửi…" : "Gửi CV"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
