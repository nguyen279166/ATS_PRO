import { RefreshCw } from "lucide-react";
import type { Candidate } from "../../types";
import { CandidateCardList } from "./CandidateCardList";
import {
  CandidateEmptyState,
  CandidateErrorState,
  CandidateLoadingState,
} from "./CandidateResultStates";
import { CandidateTable } from "./CandidateTable";

interface CandidateResultsProps {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  activeFilterCount: number;
  selectedIds: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  deletingCandidateId: string | null;
  onRetry: () => void;
  onClearSearchAndFilters: () => void;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CandidateResults({
  candidates,
  loading,
  error,
  searchTerm,
  activeFilterCount,
  selectedIds,
  isAllSelected,
  isSomeSelected,
  deletingCandidateId,
  onRetry,
  onClearSearchAndFilters,
  onToggleSelectAll,
  onToggleSelect,
  onDelete,
}: CandidateResultsProps) {
  if (loading) return <CandidateLoadingState />;
  if (error && candidates.length === 0) {
    return <CandidateErrorState message={error} onRetry={onRetry} />;
  }
  if (candidates.length === 0) {
    return (
      <CandidateEmptyState
        searchTerm={searchTerm}
        activeFilterCount={activeFilterCount}
        onClear={onClearSearchAndFilters}
      />
    );
  }

  return (
    <>
      {error && (
        <div
          className='mb-4 flex flex-col gap-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] p-3 text-sm text-[var(--color-text)] sm:flex-row sm:items-center sm:justify-between'
          role='alert'
        >
          <span>{error}. Dữ liệu bên dưới có thể chưa được cập nhật.</span>
          <button
            type='button'
            onClick={onRetry}
            className='sahara-button-secondary shrink-0 px-3 text-sm'
          >
            <RefreshCw size={16} aria-hidden='true' />
            Thử lại
          </button>
        </div>
      )}

      <CandidateTable
        candidates={candidates}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        deletingCandidateId={deletingCandidateId}
        onToggleSelectAll={onToggleSelectAll}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
      />
      <CandidateCardList
        candidates={candidates}
        selectedIds={selectedIds}
        deletingCandidateId={deletingCandidateId}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
      />
    </>
  );
}
