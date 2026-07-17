import type { DragEvent } from "react";
import { Inbox } from "lucide-react";
import type { Candidate, CandidateStatus } from "../../types";
import KanbanCandidateCard from "./KanbanCandidateCard";
import type { KanbanColumnConfig } from "./types";

type KanbanColumnProps = {
  column: KanbanColumnConfig;
  candidates: Candidate[];
  hasActiveSearch: boolean;
  isCandidateUpdating: (candidateId: string) => boolean;
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

export default function KanbanColumn({
  column,
  candidates,
  hasActiveSearch,
  isCandidateUpdating,
  onOpenCandidate,
  onStatusChange,
  onDrop,
  onDropOnCard,
}: KanbanColumnProps) {
  const headingId = `kanban-column-${column.status.toLowerCase()}`;

  return (
    <section
      className='kanban-lane flex min-h-60 flex-col overflow-hidden text-[var(--sahara-text)] xl:min-h-[590px]'
      data-status={column.status}
      aria-labelledby={headingId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void onDrop(event, column.status)}
    >
      <div className='kanban-lane-header flex items-start justify-between gap-3 px-4 py-4'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2.5'>
            <span
              className='h-2.5 w-2.5 rounded-full bg-[var(--lane-color)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--lane-color)_12%,transparent)]'
              aria-hidden='true'
            />
            <h2 id={headingId} className='text-[0.94rem] font-black tracking-[-0.01em]'>
              {column.label}
            </h2>
          </div>
          <p className='mt-1.5 pl-5 text-[11px] font-semibold text-[var(--color-text-muted)]'>
            {column.description}
          </p>
        </div>
        <span
          className='inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lane-color)] px-2 text-xs font-black tabular-nums text-white shadow-sm'
          aria-label={`${candidates.length} ứng viên`}
        >
          {candidates.length}
        </span>
      </div>

      <div className='flex min-h-36 flex-1 flex-col gap-3 p-3.5' role='list'>
        {candidates.map((candidate) => (
          <div key={candidate.id} role='listitem'>
            <KanbanCandidateCard
              candidate={candidate}
              isUpdating={isCandidateUpdating(candidate.id)}
              onOpen={onOpenCandidate}
              onStatusChange={onStatusChange}
              onDrop={onDropOnCard}
            />
          </div>
        ))}

        {candidates.length === 0 && (
          <div className='flex min-h-32 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--lane-color)_28%,var(--color-border))] bg-[var(--color-surface)]/45 p-5 text-center'>
            <span className='mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lane-soft)] text-[var(--lane-color)]'>
              <Inbox aria-hidden='true' size={19} />
            </span>
            <p className='max-w-44 text-xs font-bold leading-5 text-[var(--sahara-muted)]'>
              {hasActiveSearch
                ? "Không có kết quả phù hợp ở giai đoạn này."
                : "Kéo ứng viên vào đây khi họ đến giai đoạn này."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
