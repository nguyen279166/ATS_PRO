import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  limit: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  limit,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Tính range "Hiển thị X-Y trong Z"
  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  // Sinh ra mảng số trang cần hiển thị (tối đa 5 nút)
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 px-1">
      {/* Thông tin "Hiển thị X-Y trong Z" */}
      <p className="text-sm text-[#7d6f62]">
        Hiển thị <span className="font-semibold text-[#3a302a]">{from}–{to}</span>{" "}
        trong <span className="font-semibold text-[#3a302a]">{total}</span> ứng viên
      </p>

      {/* Các nút trang */}
      <div className="flex items-center gap-1">
        {/* Nút Trước */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-[#7d6f62] hover:bg-[#f4dfbd] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Số trang */}
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[#9a7655] select-none">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                page === currentPage
                  ? "bg-[#c2652a] text-white shadow-sm"
                  : "text-[#7d6f62] hover:bg-[#f4dfbd]"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Nút Sau */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-[#7d6f62] hover:bg-[#f4dfbd] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
