import { useState, useEffect, useCallback } from "react";
import { Search, Download, Trash2, Filter, X } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";
import { useData } from "../hooks/DataProvider";
import type { Candidate } from "../types";

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 10;
const baseUrl = import.meta.env.VITE_BASE_URL;

const STATUSES = ["Applied", "Interviewing", "Hired", "Rejected"] as const;

const STATUS_COLORS: Record<string, string> = {
  Applied:      "bg-slate-100 text-slate-600",
  Interviewing: "bg-blue-100 text-blue-700",
  Hired:        "bg-green-100 text-green-700",
  Rejected:     "bg-red-100 text-red-700",
};

export default function CandidateList() {
  const { jobs } = useData();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJobId, setFilterJobId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const token = localStorage.getItem("token_lay_duoc");
  const headers = { Authorization: `Bearer ${token}` };

  // Đếm số filter đang active
  const activeFilterCount = [filterStatus, filterJobId, filterDateFrom, filterDateTo].filter(Boolean).length;

  const fetchCandidates = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(filterStatus   && { status: filterStatus }),
        ...(filterJobId    && { jobId: filterJobId }),
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo   && { dateTo: filterDateTo }),
      });
      const res = await axios.get(`${baseUrl}/api/candidates?${params}`, { headers });
      setCandidates(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Lỗi khi tải danh sách ứng viên");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterJobId, filterDateFrom, filterDateTo]);

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
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xuất CSV
  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const csvData = [
      ["Họ và Tên", "Email", "Vị trí ứng tuyển", "Trạng thái", "Ngày ứng tuyển"],
      ...filteredCandidates.map((c) => [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.job?.title || "N/A"}"`,
        `"${c.status}"`,
        `"${c.appliedDate}"`,
      ]),
    ];
    const csvContent = BOM + csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "danh_sach_ung_vien.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ứng viên này?")) return;
    try {
      await axios.delete(`${baseUrl}/api/candidates/${candidateId}`, { headers });
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
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Danh sách Ứng viên
          {pagination && (
            <span className="ml-3 text-base font-normal text-slate-400">
              ({pagination.total} người)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 dark:bg-slate-800 dark:text-white text-sm"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors border ${
              activeFilterCount > 0
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"
            }`}
          >
            <Filter size={16} />
            Lọc
            {activeFilterCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm text-sm"
          >
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Bộ lọc nâng cao</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={13} /> Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Job filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vị trí ứng tuyển</label>
              <select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả vị trí</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ngày ứng tuyển từ</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">đến ngày</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {filterStatus && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  {filterStatus}
                  <button onClick={() => setFilterStatus("")}><X size={11} /></button>
                </span>
              )}
              {filterJobId && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  {jobs.find(j => j.id === filterJobId)?.title || filterJobId}
                  <button onClick={() => setFilterJobId("")}><X size={11} /></button>
                </span>
              )}
              {filterDateFrom && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  Từ {filterDateFrom}
                  <button onClick={() => setFilterDateFrom("")}><X size={11} /></button>
                </span>
              )}
              {filterDateTo && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  Đến {filterDateTo}
                  <button onClick={() => setFilterDateTo("")}><X size={11} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 dark:bg-slate-800 text-black dark:text-white">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-semibold">Ứng viên</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Vị trí ứng tuyển</th>
                    <th className="pb-3 font-semibold">Trạng thái</th>
                    <th className="pb-3 font-semibold">Ngày ứng tuyển</th>
                    <th className="pb-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                candidate.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=random`
                              }
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                            <span className="font-bold text-black dark:text-white">
                              {candidate.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-500 text-sm">{candidate.email}</td>
                        <td className="py-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-sm">
                            {candidate.job?.title || "Không rõ"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLORS[candidate.status] || STATUS_COLORS.Applied}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500 text-sm font-medium">
                          {new Date(candidate.appliedDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
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
