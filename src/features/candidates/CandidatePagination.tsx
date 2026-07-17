import { ChevronLeft, ChevronRight } from "lucide-react";

interface CandidatePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  limit: number;
}

const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): Array<number | "..."> => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  if (currentPage > 3) pages.push("...");
  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    pages.push(page);
  }
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
};

export function CandidatePagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  limit,
}: CandidatePaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <nav
      className='mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row'
      aria-label='Phân trang danh sách ứng viên'
    >
      <p className='text-center text-sm text-[var(--color-text-muted)] sm:text-left'>
        Hiển thị{" "}
        <span className='font-bold tabular-nums text-[var(--color-text)]'>
          {from}–{to}
        </span>{" "}
        trong{" "}
        <span className='font-bold tabular-nums text-[var(--color-text)]'>
          {total}
        </span>{" "}
        ứng viên
      </p>

      <div className='flex items-center gap-2 sm:hidden'>
        <button
          type='button'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='Trang trước'
        >
          <ChevronLeft size={19} aria-hidden='true' />
        </button>
        <span className='inline-flex min-h-11 min-w-20 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-bold tabular-nums text-[var(--color-text)]'>
          {currentPage} / {totalPages}
        </span>
        <button
          type='button'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='Trang sau'
        >
          <ChevronRight size={19} aria-hidden='true' />
        </button>
      </div>

      <div className='hidden max-w-full items-center gap-1 sm:flex'>
        <button
          type='button'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='Trang trước'
        >
          <ChevronLeft size={19} aria-hidden='true' />
        </button>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <span
              key={"ellipsis-" + index}
              className='inline-flex min-h-11 min-w-8 select-none items-center justify-center text-[var(--color-text-muted)]'
              aria-hidden='true'
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type='button'
              onClick={() => onPageChange(page)}
              aria-label={"Trang " + page}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-2 text-sm font-bold tabular-nums text-[var(--color-on-primary)]"
                  : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-strong)]"
              }
            >
              {page}
            </button>
          ),
        )}

        <button
          type='button'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='sahara-icon-button disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='Trang sau'
        >
          <ChevronRight size={19} aria-hidden='true' />
        </button>
      </div>
    </nav>
  );
}
