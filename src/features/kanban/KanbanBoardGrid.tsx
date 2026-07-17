import type { DragEvent } from "react";
import type { Candidate, CandidateStatus } from "../../types";
import { KANBAN_COLUMNS } from "./constants";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardGridProps = {
  allCandidatesCount: number;
  candidates: Candidate[];
  searchTerm: string;
  updatingCandidateIds: Set<string>;
  onOpenCandidate: (candidate: Candidate) => void;
  onStatusChange: (
    candidateId: string,
    status: CandidateStatus,
  ) => Promise<void>;
  onDrop: (event: DragEvent, status: CandidateStatus) => Promise<void>;
  onDropOnCard: (
    event: DragEvent,
    targetId: string,
    status: CandidateStatus,
  ) => Promise<void>;
};

export default function KanbanBoardGrid({
  allCandidatesCount,
  candidates,
  searchTerm,
  updatingCandidateIds,
  onOpenCandidate,
  onStatusChange,
  onDrop,
  onDropOnCard,
}: KanbanBoardGridProps) {
  const hasActiveSearch = searchTerm.trim().length > 0;
  const hasNoResults = candidates.length === 0;

  return (
    <section aria-label='Quy trình tuyển dụng' className='flex flex-1 flex-col gap-4'>
      {hasNoResults && (
        <div
          className='rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--sahara-muted)] shadow-sm'
          role='status'
          aria-live='polite'
        >
          {hasActiveSearch
            ? `Không tìm thấy ứng viên phù hợp với “${searchTerm.trim()}”. Hãy thử từ khóa khác.`
            : allCandidatesCount === 0
              ? "Chưa có ứng viên cho vị trí này. Chọn “Thêm ứng viên” để bắt đầu."
              : "Không có ứng viên phù hợp với bộ lọc hiện tại."}
        </div>
      )}

      <div className='grid flex-1 grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4 xl:gap-4'>
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            candidates={candidates.filter(
              (candidate) => candidate.status === column.status,
            )}
            hasActiveSearch={hasActiveSearch}
            isCandidateUpdating={(candidateId) =>
              updatingCandidateIds.has(candidateId)
            }
            onOpenCandidate={onOpenCandidate}
            onStatusChange={onStatusChange}
            onDrop={onDrop}
            onDropOnCard={onDropOnCard}
          />
        ))}
      </div>
    </section>
  );
}
