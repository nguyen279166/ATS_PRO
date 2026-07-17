import type { DragEvent } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  FileCheck2,
  FileText,
  GripVertical,
  Mail,
} from "lucide-react";
import Avatar from "../../components/Avatar";
import type { Candidate, CandidateStatus } from "../../types";
import { formatDate } from "../../utils/date";
import KanbanStagePicker from "./KanbanStagePicker";

type KanbanCandidateCardProps = {
  candidate: Candidate;
  isUpdating: boolean;
  onOpen: (candidate: Candidate) => void;
  onStatusChange: (
    candidateId: string,
    status: CandidateStatus,
  ) => Promise<void>;
  onDrop: (
    event: DragEvent,
    targetId: string,
    status: CandidateStatus,
  ) => Promise<void>;
};

export default function KanbanCandidateCard({
  candidate,
  isUpdating,
  onOpen,
  onStatusChange,
  onDrop,
}: KanbanCandidateCardProps) {
  return (
    <article
      className='kanban-candidate-card group cursor-grab p-3.5 text-[var(--sahara-text)] active:cursor-grabbing'
      data-status={candidate.status}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("candidateId", candidate.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void onDrop(event, candidate.id, candidate.status)}
    >
      <GripVertical
        aria-hidden='true'
        className='pointer-events-none absolute right-3 top-3 text-[var(--color-text-muted)]/35 transition-colors group-hover:text-[var(--lane-color)]'
        size={17}
      />
      <button
        type='button'
        className='relative block w-full rounded-xl pr-5 text-left'
        onClick={() => onOpen(candidate)}
        aria-label={`Mở chi tiết ứng viên ${candidate.name}`}
      >
        <span className='flex min-h-12 items-center gap-3'>
          <Avatar
            name={candidate.name}
            src={candidate.avatar}
            className='h-11 w-11 text-xs shadow-sm ring-2 ring-[var(--color-surface)]'
            imageClassName='ring-2 ring-[var(--color-surface)]'
          />
          <span className='min-w-0 flex-1'>
            <span className='block break-words pr-1 text-[0.94rem] font-black leading-5 tracking-[-0.01em]'>
              {candidate.name}
            </span>
            <span className='mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--sahara-muted)]'>
              <Mail aria-hidden='true' className='shrink-0' size={13} />
              <span className='truncate'>{candidate.email}</span>
            </span>
          </span>
        </span>

        <span className='mt-4 flex flex-wrap items-center gap-2'>
          <span className='inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[var(--color-surface-subtle)] px-2.5 text-[10px] font-bold tabular-nums text-[var(--color-text-muted)]'>
            <CalendarDays aria-hidden='true' size={13} />
            {formatDate(candidate.appliedDate)}
          </span>
          <span
            className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-black ${
              candidate.cvUrl || candidate.cvFileName
                ? "bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] text-[var(--color-secondary)]"
                : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
            }`}
          >
            {candidate.cvUrl || candidate.cvFileName ? (
              <FileCheck2 aria-hidden='true' size={13} />
            ) : (
              <FileText aria-hidden='true' size={13} />
            )}
            {candidate.cvUrl || candidate.cvFileName ? "CV sẵn sàng" : "Chưa có CV"}
          </span>
        </span>

        <ArrowUpRight
          aria-hidden='true'
          className='absolute -right-0.5 bottom-1 text-[var(--color-text-muted)]/45 opacity-0 transition-[opacity,transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--lane-color)] group-hover:opacity-100'
          size={17}
        />
      </button>

      <div
        className='mt-3 flex items-center border-t border-[var(--color-border)] pt-3'
        onClick={(event) => event.stopPropagation()}
      >
        <KanbanStagePicker
          candidateId={candidate.id}
          candidateName={candidate.name}
          value={candidate.status}
          isUpdating={isUpdating}
          onChange={(status) => onStatusChange(candidate.id, status)}
        />
      </div>
    </article>
  );
}
