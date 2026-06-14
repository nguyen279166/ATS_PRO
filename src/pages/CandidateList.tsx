import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Trash2,
  Filter,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";
import { useData } from "../hooks/DataProvider";
import { useAuth } from "../hooks/useAuth";
import type { Candidate } from "../types";
import { API_BASE_URL } from "../config/env";
import Avatar from "../components/Avatar";
import { formatDate } from "../utils/date";

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 10;
const STATUSES = ["Applied", "Interviewing", "Hired", "Rejected"] as const;

const STATUS_COLORS: Record<string, string> = {
  Applied: "sahara-status sahara-status-applied",
  Interviewing: "sahara-status sahara-status-interviewing",
  Hired: "sahara-status sahara-status-hired",
  Rejected: "sahara-status sahara-status-rejected",
};

export default function CandidateList() {
  const { jobs } = useData();
  const { isAdmin } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Bulk select

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJobId, setFilterJobId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const token = localStorage.getItem("token_lay_duoc");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  // Đếm số filter đang active
  const activeFilterCount = [
    filterStatus,
    filterJobId,
    filterDateFrom,
    filterDateTo,
  ].filter(Boolean).length;

  const fetchCandidates = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
          ...(filterStatus && { status: filterStatus }),
          ...(filterJobId && { jobId: filterJobId }),
          ...(filterDateFrom && { dateFrom: filterDateFrom }),
          ...(filterDateTo && { dateTo: filterDateTo }),
        });
        const res = await axios.get(
          `${API_BASE_URL}/api/candidates?${params}`,
          { headers },
        );
        setCandidates(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        toast.error("Lỗi khi tải danh sách ứng viên");
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, filterJobId, filterDateFrom, filterDateTo, headers],
  );

  // Reset page về 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterJobId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchCandidates(currentPage);
  }, [currentPage, fetchCandidates]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilterStatus("");
    setFilterJobId("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // Lọc client-side theo search (trên trang hiện tại)
  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Bulk select helpers
  const allVisibleIds = filteredCandidates.map((c) => c.id);
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !allVisibleIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allVisibleIds])]);
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/candidates/bulk`,
        { ids: selectedIds, action: "updateStatus", status },
        { headers },
      );
      toast.success(
        `Đã cập nhật ${selectedIds.length} ứng viên sang ${status}`,
      );
      setSelectedIds([]);
      fetchCandidates(currentPage);
    } catch {
      toast.error("Lỗi khi cập nhật hàng loạt");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Xóa ${selectedIds.length} ứng viên đã chọn?`)) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/candidates/bulk`,
        { ids: selectedIds, action: "delete" },
        { headers },
      );
      toast.success(`Đã xóa ${selectedIds.length} ứng viên`);
      setSelectedIds([]);
      fetchCandidates(currentPage);
    } catch {
      toast.error("Lỗi khi xóa hàng loạt");
    }
  };

  // Xuất Excel
  const handleExportExcel = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/export/candidates.xlsx`,
        {
          headers,
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "danh_sach_ung_vien.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Lỗi khi xuất Excel");
    }
  };

  // Xuất PDF
  const handleExportPDF = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/export/report.pdf`, {
        headers,
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bao_cao_tuyen_dung.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Lỗi khi xuất PDF");
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ứng viên này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/${candidateId}`, {
        headers,
      });
      toast.success("Xóa ứng viên thành công!");
      const isLastOnPage = candidates.length === 1 && currentPage > 1;
      fetchCandidates(isLastOnPage ? currentPage - 1 : currentPage);
      if (isLastOnPage) setCurrentPage((p) => p - 1);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Lỗi khi xóa ứng viên");
      } else {
        toast.error("Lỗi khi xóa ứng viên");
      }
    }
  };

  return (
    <div>
      <ToastContainer position='bottom-right' />

      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-black text-[#3a302a]'>
          Danh sách Ứng viên
          {pagination && (
            <span className='ml-3 text-base font-normal text-[#9a7655]'>
              ({pagination.total} người)
            </span>
          )}
        </h2>
        <div className='flex items-center gap-3'>
          {/* Search */}
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Search size={16} className='text-[#9a7655]' />
            </div>
            <input
              type='text'
              placeholder='Tìm theo tên...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='sahara-input pl-9 pr-4 py-2 w-56 text-sm'
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors border ${
              activeFilterCount > 0
                ? "bg-[#c2652a] text-white border-[#c2652a]"
                : "bg-[#fffaf2] text-[#5b4a3a] border-[#d8c8b5] hover:border-[#c2652a]"
            }`}
          >
            <Filter size={16} />
            Lọc
            {activeFilterCount > 0 && (
              <span className='bg-white text-[#c2652a] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export — chỉ Admin */}
          {isAdmin && (
            <>
              <button
                onClick={handleExportExcel}
                className='sahara-button px-4 py-2 text-sm'
              >
                <FileSpreadsheet size={16} /> Excel
              </button>

              <button
                onClick={handleExportPDF}
                className='sahara-button-secondary px-4 py-2 text-sm'
              >
                <FileText size={16} /> PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='sahara-card p-5 mb-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-[#3a302a] text-sm'>
              Bộ lọc nâng cao
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className='flex items-center gap-1 text-xs text-[#9a7655] hover:text-[#8c3c3c] transition-colors'
              >
                <X size={13} /> Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Status filter */}
            <div>
              <label className='block text-xs font-semibold text-[#7d6f62] mb-1.5'>
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='sahara-input w-full px-3 py-2 text-sm'
              >
                <option value=''>Tất cả trạng thái</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Job filter */}
            <div>
              <label className='block text-xs font-semibold text-[#7d6f62] mb-1.5'>
                Vị trí ứng tuyển
              </label>
              <select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                className='sahara-input w-full px-3 py-2 text-sm'
              >
                <option value=''>Tất cả vị trí</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className='block text-xs font-semibold text-[#7d6f62] mb-1.5'>
                Ngày ứng tuyển từ
              </label>
              <input
                type='date'
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className='sahara-input w-full px-3 py-2 text-sm'
              />
            </div>

            {/* Date to */}
            <div>
              <label className='block text-xs font-semibold text-[#7d6f62] mb-1.5'>
                đến ngày
              </label>
              <input
                type='date'
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className='sahara-input w-full px-3 py-2 text-sm'
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#d8c8b5]/70'>
              {filterStatus && (
                <span className='flex items-center gap-1 px-3 py-1 bg-[#f4dfbd] text-[#8a4518] text-xs font-semibold rounded-full'>
                  {filterStatus}
                  <button onClick={() => setFilterStatus("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {filterJobId && (
                <span className='flex items-center gap-1 px-3 py-1 bg-[#f4dfbd] text-[#8a4518] text-xs font-semibold rounded-full'>
                  {jobs.find((j) => j.id === filterJobId)?.title || filterJobId}
                  <button onClick={() => setFilterJobId("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {filterDateFrom && (
                <span className='flex items-center gap-1 px-3 py-1 bg-[#f4dfbd] text-[#8a4518] text-xs font-semibold rounded-full'>
                  Từ {filterDateFrom}
                  <button onClick={() => setFilterDateFrom("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {filterDateTo && (
                <span className='flex items-center gap-1 px-3 py-1 bg-[#f4dfbd] text-[#8a4518] text-xs font-semibold rounded-full'>
                  Đến {filterDateTo}
                  <button onClick={() => setFilterDateTo("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className='flex items-center gap-3 mb-4 px-4 py-3 bg-[#f4dfbd]/80 border border-[#d8c8b5] rounded-lg'>
          <span className='text-sm font-semibold text-[#8a4518]'>
            Đã chọn {selectedIds.length} ứng viên
          </span>
          <div className='flex items-center gap-2 ml-auto'>
            <span className='text-xs text-[#7d6f62]'>Chuyển sang:</span>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleBulkStatusUpdate(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${STATUS_COLORS[s]}`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={handleBulkDelete}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors'
            >
              <Trash2 size={13} /> Xóa tất cả
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className='p-1.5 text-[#9a7655] hover:text-[#3a302a] rounded-lg transition-colors'
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='sahara-card p-5 text-[#3a302a]'>
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600' />
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='sahara-table candidates-table text-left'>
                <thead>
                  <tr>
                    <th className='pb-3 pl-2 w-12'>
                      <button
                        onClick={toggleSelectAll}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isAllSelected
                            ? "bg-[#c2652a] border-[#c2652a]"
                            : "border-[#d8c8b5] hover:border-[#c2652a]"
                        }`}
                      >
                        {isAllSelected && (
                          <svg
                            className='w-3 h-3 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        )}
                      </button>
                    </th>
                    <th className='pb-3 font-semibold'>Ứng viên</th>
                    <th className='pb-3 font-semibold'>Email</th>
                    <th className='pb-3 font-semibold'>Vị trí ứng tuyển</th>
                    <th className='pb-3 font-semibold'>Trạng thái</th>
                    <th className='pb-3 font-semibold'>Ngày ứng tuyển</th>
                    <th className='pb-3 font-semibold text-right'>
                      <span className='sr-only'>Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        onClick={() => toggleSelect(candidate.id)}
                        className={`transition-colors cursor-pointer ${
                          selectedIds.includes(candidate.id)
                            ? "bg-[#f4dfbd]/70"
                            : "hover:bg-[#fff4e2]"
                        }`}
                      >
                        <td className='py-4 pl-2'>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              selectedIds.includes(candidate.id)
                                ? "bg-[#c2652a] border-[#c2652a]"
                                : "border-[#d8c8b5]"
                            }`}
                          >
                            {selectedIds.includes(candidate.id) && (
                              <svg
                                className='w-3 h-3 text-white'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  d='M5 13l4 4L19 7'
                                />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className='py-4'>
                          <div className='flex items-center gap-3'>
                            <Avatar
                              name={candidate.name}
                              className='h-10 w-10 text-sm'
                            />
                            <span className='font-bold text-[#3a302a]'>
                              {candidate.name}
                            </span>
                          </div>
                        </td>
                        <td className='py-4 text-[#7d6f62] text-sm'>
                          {candidate.email}
                        </td>
                        <td className='py-4'>
                          <span className='font-medium text-[#5b4a3a] bg-[#f4dfbd]/70 px-3 py-1 rounded-lg text-sm'>
                            {candidate.job?.title || "Không rõ"}
                          </span>
                        </td>
                        <td className='py-4'>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLORS[candidate.status] || STATUS_COLORS.Applied}`}
                          >
                            {candidate.status}
                          </span>
                        </td>
                        <td className='py-4 text-[#7d6f62] text-sm font-medium'>
                          {formatDate(candidate.appliedDate)}
                        </td>
                        <td className='py-4 text-right'>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className='p-1.5 text-[#9a7655] hover:text-[#8c3c3c] hover:bg-[#f2ded4] rounded-lg transition-colors'
                            title='Xóa'
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className='py-8 text-center text-[#7d6f62]'
                      >
                        Không tìm thấy ứng viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination && !searchTerm && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                limit={pagination.limit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
