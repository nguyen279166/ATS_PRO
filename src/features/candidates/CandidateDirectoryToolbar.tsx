import {
  FileSpreadsheet,
  FileText,
  Filter,
  LoaderCircle,
  Search,
} from "lucide-react";
import type { CandidateExportFormat } from "./candidateDirectory.types";

interface CandidateDirectoryToolbarProps {
  total: number | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  isAdmin: boolean;
  exportingFormat: CandidateExportFormat | null;
  onExport: (format: CandidateExportFormat) => void;
}

export function CandidateDirectoryToolbar({
  total,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  isAdmin,
  exportingFormat,
  onExport,
}: CandidateDirectoryToolbarProps) {
  return (
    <section
      className='mb-5 flex flex-col gap-4'
      aria-label='Tìm kiếm, lọc và xuất danh sách ứng viên'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p
          className='text-sm font-semibold text-[var(--color-text-muted)]'
          aria-live='polite'
        >
          {total === null
            ? "Đang cập nhật tổng số ứng viên"
            : total + " ứng viên trong hệ thống"}
        </p>

        {isAdmin && (
          <div
            className='flex w-full flex-wrap gap-2 sm:w-auto'
            aria-label='Xuất báo cáo'
          >
            <button
              type='button'
              onClick={() => onExport("excel")}
              disabled={exportingFormat !== null}
              className='sahara-button min-w-28 flex-1 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none'
            >
              {exportingFormat === "excel" ? (
                <LoaderCircle
                  size={17}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <FileSpreadsheet size={17} aria-hidden='true' />
              )}
              {exportingFormat === "excel" ? "Đang xuất" : "Excel"}
            </button>
            <button
              type='button'
              onClick={() => onExport("pdf")}
              disabled={exportingFormat !== null}
              className='sahara-button-secondary min-w-28 flex-1 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none'
            >
              {exportingFormat === "pdf" ? (
                <LoaderCircle
                  size={17}
                  className='animate-spin motion-reduce:animate-none'
                  aria-hidden='true'
                />
              ) : (
                <FileText size={17} aria-hidden='true' />
              )}
              {exportingFormat === "pdf" ? "Đang xuất" : "PDF"}
            </button>
          </div>
        )}
      </div>

      <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-end'>
        <div className='min-w-0 flex-1'>
          <label
            htmlFor='candidate-search'
            className='mb-1.5 block text-xs font-bold text-[var(--color-text-muted)]'
          >
            Tìm ứng viên theo tên
          </label>
          <div className='relative'>
            <Search
              size={17}
              className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]'
              aria-hidden='true'
            />
            <input
              id='candidate-search'
              type='search'
              placeholder='Nhập tên ứng viên...'
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className='sahara-input w-full py-2 pl-10 pr-4 text-base sm:max-w-md sm:text-sm'
            />
          </div>
        </div>

        <button
          type='button'
          onClick={onToggleFilters}
          aria-expanded={showFilters}
          aria-controls='candidate-filter-panel'
          className={
            activeFilterCount > 0
              ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-on-primary)] transition-colors"
              : "sahara-button-secondary px-4 text-sm"
          }
        >
          <Filter size={17} aria-hidden='true' />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className='inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-surface)] px-1.5 text-xs font-black text-[var(--color-primary)]'>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
