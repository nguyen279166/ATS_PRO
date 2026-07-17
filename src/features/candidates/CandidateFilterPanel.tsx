import { X } from "lucide-react";
import type { Job } from "../../types";
import { CANDIDATE_STATUSES } from "./candidateDirectory.constants";
import type {
  CandidateFilterKey,
  CandidateFilters,
} from "./candidateDirectory.types";

interface CandidateFilterPanelProps {
  jobs: Job[];
  filters: CandidateFilters;
  activeFilterCount: number;
  onFilterChange: (key: CandidateFilterKey, value: string) => void;
  onClearFilters: () => void;
}

export function CandidateFilterPanel({
  jobs,
  filters,
  activeFilterCount,
  onFilterChange,
  onClearFilters,
}: CandidateFilterPanelProps) {
  const activeFilters: Array<{
    key: CandidateFilterKey;
    label: string;
  }> = [];

  if (filters.status) {
    activeFilters.push({ key: "status", label: filters.status });
  }
  if (filters.jobId) {
    activeFilters.push({
      key: "jobId",
      label:
        jobs.find((job) => job.id === filters.jobId)?.title ||
        filters.jobId,
    });
  }
  if (filters.dateFrom) {
    activeFilters.push({
      key: "dateFrom",
      label: "Từ " + filters.dateFrom,
    });
  }
  if (filters.dateTo) {
    activeFilters.push({
      key: "dateTo",
      label: "Đến " + filters.dateTo,
    });
  }

  return (
    <section
      id='candidate-filter-panel'
      className='sahara-card mb-5 p-4 sm:p-5'
      aria-labelledby='candidate-filter-heading'
    >
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <h2
          id='candidate-filter-heading'
          className='text-base font-bold text-[var(--color-text)]'
        >
          Bộ lọc nâng cao
        </h2>
        {activeFilterCount > 0 && (
          <button
            type='button'
            onClick={onClearFilters}
            className='sahara-button-secondary px-3 text-sm'
          >
            <X size={16} aria-hidden='true' />
            Xóa tất cả bộ lọc
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <label
            htmlFor='candidate-filter-status'
            className='mb-1.5 block text-xs font-bold text-[var(--color-text-muted)]'
          >
            Trạng thái
          </label>
          <select
            id='candidate-filter-status'
            value={filters.status}
            onChange={(event) =>
              onFilterChange("status", event.target.value)
            }
            className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
          >
            <option value=''>Tất cả trạng thái</option>
            {CANDIDATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='candidate-filter-job'
            className='mb-1.5 block text-xs font-bold text-[var(--color-text-muted)]'
          >
            Vị trí ứng tuyển
          </label>
          <select
            id='candidate-filter-job'
            value={filters.jobId}
            onChange={(event) =>
              onFilterChange("jobId", event.target.value)
            }
            className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
          >
            <option value=''>Tất cả vị trí</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='candidate-filter-date-from'
            className='mb-1.5 block text-xs font-bold text-[var(--color-text-muted)]'
          >
            Ngày ứng tuyển từ
          </label>
          <input
            id='candidate-filter-date-from'
            type='date'
            value={filters.dateFrom}
            onChange={(event) =>
              onFilterChange("dateFrom", event.target.value)
            }
            className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
          />
        </div>

        <div>
          <label
            htmlFor='candidate-filter-date-to'
            className='mb-1.5 block text-xs font-bold text-[var(--color-text-muted)]'
          >
            Đến ngày
          </label>
          <input
            id='candidate-filter-date-to'
            type='date'
            value={filters.dateTo}
            onChange={(event) =>
              onFilterChange("dateTo", event.target.value)
            }
            className='sahara-input w-full px-3 py-2 text-base sm:text-sm'
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4'>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type='button'
              onClick={() => onFilterChange(filter.key, "")}
              aria-label={"Xóa bộ lọc " + filter.label}
              className='inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-xs font-bold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]'
            >
              {filter.label}
              <X size={15} aria-hidden='true' />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
