import { LoaderCircle, Trash2 } from "lucide-react";
import Avatar from "../../components/Avatar";
import type { Candidate } from "../../types";
import { formatDate } from "../../utils/date";
import { CandidateSelectionCheckbox } from "./CandidateSelectionCheckbox";
import { CandidateStatusBadge } from "./CandidateStatusBadge";

interface CandidateCardListProps {
  candidates: Candidate[];
  selectedIds: string[];
  deletingCandidateId: string | null;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CandidateCardList({
  candidates,
  selectedIds,
  deletingCandidateId,
  onToggleSelect,
  onDelete,
}: CandidateCardListProps) {
  return (
    <ul className='space-y-3 md:hidden' aria-label='Danh sách ứng viên'>
      {candidates.map((candidate) => {
        const selected = selectedIds.includes(candidate.id);
        const deleting = deletingCandidateId === candidate.id;

        return (
          <li
            key={candidate.id}
            onClick={() => onToggleSelect(candidate.id)}
            className={
              selected
                ? "sahara-card-soft cursor-pointer border-[var(--color-primary)] p-4"
                : "sahara-card-soft cursor-pointer p-4"
            }
          >
            <div className='flex items-start gap-2'>
              <CandidateSelectionCheckbox
                checked={selected}
                label={"Chọn ứng viên " + candidate.name}
                onChange={() => onToggleSelect(candidate.id)}
              />
              <Avatar
                name={candidate.name}
                className='mt-0.5 h-10 w-10 shrink-0 text-sm'
              />
              <div className='min-w-0 flex-1'>
                <p className='break-words font-bold text-[var(--color-text)]'>
                  {candidate.name}
                </p>
                <div className='mt-2'>
                  <CandidateStatusBadge status={candidate.status} />
                </div>
              </div>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(candidate.id);
                }}
                disabled={deletingCandidateId !== null}
                className='sahara-icon-button -mr-2 -mt-1 shrink-0 text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50'
                aria-label={"Xóa ứng viên " + candidate.name}
              >
                {deleting ? (
                  <LoaderCircle
                    size={18}
                    className='animate-spin motion-reduce:animate-none'
                    aria-hidden='true'
                  />
                ) : (
                  <Trash2 size={18} aria-hidden='true' />
                )}
              </button>
            </div>

            <dl className='mt-4 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-[var(--color-border)] pt-3 text-sm'>
              <dt className='font-semibold text-[var(--color-text-muted)]'>
                Email
              </dt>
              <dd className='min-w-0 break-all text-[var(--color-text)]'>
                {candidate.email}
              </dd>
              <dt className='font-semibold text-[var(--color-text-muted)]'>
                Vị trí
              </dt>
              <dd className='min-w-0 break-words text-[var(--color-text)]'>
                {candidate.job?.title || "Không rõ"}
              </dd>
              <dt className='font-semibold text-[var(--color-text-muted)]'>
                Ngày ứng tuyển
              </dt>
              <dd className='tabular-nums text-[var(--color-text)]'>
                {formatDate(candidate.appliedDate)}
              </dd>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
