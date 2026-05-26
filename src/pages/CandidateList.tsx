import { useState, useEffect, useCallback } from "react";
import { Search, Download, Trash2 } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";
import type { Candidate } from "../types";

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 10;
const baseUrl = import.meta.env.VITE_BASE_URL;

export default function CandidateList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token_lay_duoc");
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch candidates theo page
  const fetchCandidates = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${baseUrl}/api/candidates?page=${page}&limit=${LIMIT}`,
        { headers }
      );
      setCandidates(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Lỗi khi tải danh sách ứng viên");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(currentPage);
  }, [currentPage, fetchCandidates]);

  // Đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Lọc client-side theo search (trên trang hiện tại)
  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xuất CSV toàn bộ trang hiện tại
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
      // Nếu xóa hết trang hiện tại thì quay về trang trước
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Danh sách Tất cả Ứng viên
        </h2>
        <div className="flex items-center gap-4">
          {/* Thanh tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm ứng viên theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all dark:text-white"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={18} /> Xuất CSV
          </button>
        </div>
      </div>

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
                          <span className="font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                            {candidate.job?.title || "Không rõ"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              candidate.status === "Hired"
                                ? "bg-green-100 text-green-700"
                                : candidate.status === "Interviewing"
                                  ? "bg-blue-100 text-blue-700"
                                  : candidate.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
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

            {/* Pagination */}
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
