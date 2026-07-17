import { LoaderCircle, Trash2 } from "lucide-react";
import Avatar from "../../components/Avatar";
import type { Candidate } from "../../types";
import { formatDate } from "../../utils/date";
import { CandidateSelectionCheckbox } from "./CandidateSelectionCheckbox";
import { CandidateStatusBadge } from "./CandidateStatusBadge";

interface CandidateTableProps {
  candidates: Candidate[];
  selectedIds: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  deletingCandidateId: string | null;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CandidateTable({
  candidates,
  selectedIds,
  isAllSelected,
  isSomeSelected,
  deletingCandidateId,
  onToggleSelectAll,
  onToggleSelect,
  onDelete,
}: CandidateTableProps) {
  return (
    <div className='hidden overflow-x-auto md:block'>
      <table className='sahara-table candidates-table min-w-[900px] text-left'>
        <caption className='sr-only'>
          Danh sách ứng viên, vị trí, trạng thái và ngày ứng tuyển
        </caption>
        <thead>
          <tr>
            <th className='sticky top-0 z-10 w-14 px-1 py-2'>
              <CandidateSelectionCheckbox
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                label='Chọn tất cả ứng viên đang hiển thị'
                onChange={onToggleSelectAll}
              />
            </th>
            <th className='sticky top-0 z-10 px-3 py-3'>Ứng viên</th>
            <th className='sticky top-0 z-10 px-3 py-3'>Email</th>
            <th className='sticky top-0 z-10 px-3 py-3'>
              Vị trí ứng tuyển
            </th>
            <th className='sticky top-0 z-10 px-3 py-3'>Trạng thái</th>
            <th className='sticky top-0 z-10 px-3 py-3'>
              Ngày ứng tuyển
            </th>
            <th className='sticky top-0 z-10 w-16 px-1 py-3 text-right'>
              <span className='sr-only'>Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const selected = selectedIds.includes(candidate.id);
            const deleting = deletingCandidateId === candidate.id;

            return (
              <tr
                key={candidate.id}
                aria-selected={selected}
                onClick={() => onToggleSelect(candidate.id)}
                className={
                  selected
                    ? "cursor-pointer bg-[var(--color-surface-strong)] transition-colors"
                    : "cursor-pointer transition-colors hover:bg-[var(--color-surface-subtle)]"
                }
              >
                <td className='px-1 py-2'>
                  <CandidateSelectionCheckbox
                    checked={selected}
                    label={"Chọn ứng viên " + candidate.name}
                    onChange={() => onToggleSelect(candidate.id)}
                  />
                </td>
                <td className='px-3 py-3'>
                  <div className='flex items-center gap-3'>
                    <Avatar
                      name={candidate.name}
                      className='h-10 w-10 shrink-0 text-sm'
                    />
                    <span className='font-bold text-[var(--color-text)]'>
                      {candidate.name}
                    </span>
                  </div>
                </td>
                <td className='px-3 py-3 text-sm text-[var(--color-text-muted)]'>
                  {candidate.email}
                </td>
                <td className='px-3 py-3'>
                  <span className='inline-flex rounded-lg bg-[var(--color-surface-strong)] px-3 py-1 text-sm font-semibold text-[var(--color-text)]'>
                    {candidate.job?.title || "Không rõ"}
                  </span>
                </td>
                <td className='px-3 py-3'>
                  <CandidateStatusBadge status={candidate.status} />
                </td>
                <td className='px-3 py-3 text-sm font-semibold tabular-nums text-[var(--color-text-muted)]'>
                  {formatDate(candidate.appliedDate)}
                </td>
                <td className='px-1 py-2 text-right'>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(candidate.id);
                    }}
                    disabled={deletingCandidateId !== null}
                    className='sahara-icon-button text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50'
                    aria-label={"Xóa ứng viên " + candidate.name}
                    title='Xóa'
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
