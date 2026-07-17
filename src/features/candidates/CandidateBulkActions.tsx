import { LoaderCircle, Trash2, X } from "lucide-react";
import type { CandidateStatus } from "../../types";
import {
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_CLASSES,
} from "./candidateDirectory.constants";
import type { CandidateBulkAction } from "./candidateDirectory.types";

interface CandidateBulkActionsProps {
  selectedCount: number;
  pendingAction: CandidateBulkAction | null;
  onUpdateStatus: (status: CandidateStatus) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function CandidateBulkActions({
  selectedCount,
  pendingAction,
  onUpdateStatus,
  onDelete,
  onClear,
}: CandidateBulkActionsProps) {
  return (
    <section
      className='sahara-card-soft mb-4 flex flex-col gap-3 p-3 sm:p-4'
      aria-label='Thao tác hàng loạt'
      aria-busy={pendingAction !== null}
    >
      <div className='flex items-center justify-between gap-3'>
        <p
          className='text-sm font-bold text-[var(--color-text)]'
          aria-live='polite'
        >
          Đã chọn {selectedCount} ứng viên
        </p>
        <button
          type='button'
          onClick={onClear}
          disabled={pendingAction !== null}
          className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='Bỏ chọn tất cả ứng viên'
        >
          <X size={18} aria-hidden='true' />
        </button>
      </div>

      <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
        <span className='text-xs font-bold text-[var(--color-text-muted)]'>
          Chuyển sang:
        </span>
        <div className='flex flex-wrap gap-2'>
          {CANDIDATE_STATUSES.map((status) => (
            <button
              key={status}
              type='button'
              onClick={() => onUpdateStatus(status)}
              disabled={pendingAction !== null}
              className={
                CANDIDATE_STATUS_CLASSES[status] +
                " min-h-11 px-3 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {status}
            </button>
          ))}
        </div>

        <button
          type='button'
          onClick={onDelete}
          disabled={pendingAction !== null}
          className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 text-sm font-bold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:ml-auto'
        >
          {pendingAction === "delete" ? (
            <LoaderCircle
              size={17}
              className='animate-spin motion-reduce:animate-none'
              aria-hidden='true'
            />
          ) : (
            <Trash2 size={17} aria-hidden='true' />
          )}
          {pendingAction === "delete" ? "Đang xóa" : "Xóa tất cả"}
        </button>
      </div>
    </section>
  );
}
