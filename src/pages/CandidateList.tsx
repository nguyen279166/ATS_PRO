import { CandidateBulkActions } from "../features/candidates/CandidateBulkActions";
import { CandidateDirectoryToolbar } from "../features/candidates/CandidateDirectoryToolbar";
import { CandidateFilterPanel } from "../features/candidates/CandidateFilterPanel";
import { CandidatePagination } from "../features/candidates/CandidatePagination";
import { CandidateResults } from "../features/candidates/CandidateResults";
import { useCandidateDirectory } from "../features/candidates/useCandidateDirectory";

export default function CandidateList() {
  const directory = useCandidateDirectory();

  return (
    <div>
      <CandidateDirectoryToolbar
        total={
          directory.loading || directory.error
            ? null
            : directory.pagination?.total ?? null
        }
        searchTerm={directory.searchTerm}
        onSearchChange={directory.setSearchTerm}
        showFilters={directory.showFilters}
        onToggleFilters={() =>
          directory.setShowFilters((current) => !current)
        }
        activeFilterCount={directory.activeFilterCount}
        hasActiveCriteria={directory.hasActiveCriteria}
        hasTotalError={Boolean(directory.error)}
        isAdmin={directory.isAdmin}
        exportingFormat={directory.exportingFormat}
        onExport={directory.handleExport}
      />

      {directory.showFilters && (
        <CandidateFilterPanel
          jobs={directory.jobs}
          filters={directory.filters}
          activeFilterCount={directory.activeFilterCount}
          onFilterChange={directory.updateFilter}
          onClearFilters={directory.clearFilters}
        />
      )}

      {directory.selectedIds.length > 0 && (
        <CandidateBulkActions
          selectedCount={directory.selectedIds.length}
          pendingAction={directory.pendingBulkAction}
          onUpdateStatus={directory.handleBulkStatusUpdate}
          onDelete={directory.handleBulkDelete}
          onClear={directory.clearSelection}
        />
      )}

      <section
        className='sahara-card p-3 text-[var(--color-text)] sm:p-5'
        aria-label='Kết quả danh sách ứng viên'
        aria-busy={directory.loading}
      >
        <CandidateResults
          candidates={directory.candidates}
          loading={directory.loading}
          error={directory.error}
          searchTerm={directory.searchTerm}
          activeFilterCount={directory.activeFilterCount}
          selectedIds={directory.selectedIds}
          isAllSelected={directory.isAllSelected}
          isSomeSelected={directory.isSomeSelected}
          deletingCandidateId={directory.deletingCandidateId}
          onRetry={directory.retry}
          onClearSearchAndFilters={directory.clearSearchAndFilters}
          onToggleSelectAll={directory.toggleSelectAll}
          onToggleSelect={directory.toggleSelect}
          onDelete={directory.handleDeleteCandidate}
        />

        {!directory.loading &&
          directory.pagination &&
          directory.candidates.length > 0 && (
            <CandidatePagination
              currentPage={directory.pagination.page}
              totalPages={directory.pagination.totalPages}
              onPageChange={directory.handlePageChange}
              total={directory.pagination.total}
              limit={directory.pagination.limit}
            />
          )}
      </section>
    </div>
  );
}
