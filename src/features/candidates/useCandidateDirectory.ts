import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/env";
import { useData } from "../../hooks/DataProvider";
import { useAuth } from "../../hooks/useAuth";
import type { Candidate, CandidateStatus } from "../../types";
import { CANDIDATE_PAGE_LIMIT } from "./candidateDirectory.constants";
import type {
  CandidateBulkAction,
  CandidateExportFormat,
  CandidateFilterKey,
  CandidateFilters,
  CandidatePaginationInfo,
} from "./candidateDirectory.types";

const INITIAL_FILTERS: CandidateFilters = {
  status: "",
  jobId: "",
  dateFrom: "",
  dateTo: "",
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function useCandidateDirectory() {
  const { jobs } = useData();
  const { isAdmin } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] =
    useState<CandidatePaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CandidateFilters>(INITIAL_FILTERS);
  const [pendingBulkAction, setPendingBulkAction] =
    useState<CandidateBulkAction | null>(null);
  const [exportingFormat, setExportingFormat] =
    useState<CandidateExportFormat | null>(null);
  const [deletingCandidateId, setDeletingCandidateId] =
    useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const token = localStorage.getItem("token_lay_duoc");
  const headers = useMemo(
    () => ({ Authorization: "Bearer " + token }),
    [token],
  );

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );
  const hasActiveCriteria = Boolean(
    debouncedSearchTerm || activeFilterCount,
  );

  const fetchCandidates = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const requestId = ++latestRequestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(CANDIDATE_PAGE_LIMIT),
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
          ...(filters.status && { status: filters.status }),
          ...(filters.jobId && { jobId: filters.jobId }),
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo }),
        });
        const response = await axios.get(
          API_BASE_URL + "/api/candidates?" + params,
          { headers, signal },
        );
        if (requestId !== latestRequestIdRef.current || signal?.aborted) return;

        const nextPagination = response.data
          .pagination as CandidatePaginationInfo;
        const lastAvailablePage = Math.max(1, nextPagination.totalPages);
        if (page > lastAvailablePage) {
          setCurrentPage(lastAvailablePage);
          return;
        }

        setCandidates(response.data.data);
        setPagination(nextPagination);
      } catch (requestError: unknown) {
        if (
          requestId !== latestRequestIdRef.current ||
          signal?.aborted ||
          axios.isCancel(requestError)
        ) {
          return;
        }

        const message = "Lỗi khi tải danh sách ứng viên";
        setError(message);
        toast.error(message);
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [
      filters.status,
      filters.jobId,
      filters.dateFrom,
      filters.dateTo,
      debouncedSearchTerm,
      headers,
    ],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchCandidates(currentPage, controller.signal);

    return () => controller.abort();
  }, [currentPage, fetchCandidates, refreshVersion]);

  const allVisibleIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates],
  );
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));
  const isSomeSelected =
    !isAllSelected && allVisibleIds.some((id) => selectedIds.includes(id));

  const updateFilter = useCallback(
    (key: CandidateFilterKey, value: string) => {
      setFilters((current) => ({ ...current, [key]: value }));
      setCurrentPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  }, []);

  const clearSearchAndFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !allVisibleIds.includes(id));
      }
      return [...new Set([...current, ...allVisibleIds])];
    });
  }, [allVisibleIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id],
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);
  const requestRefresh = useCallback(
    () => setRefreshVersion((version) => version + 1),
    [],
  );

  const handleBulkStatusUpdate = useCallback(
    async (status: CandidateStatus) => {
      if (pendingBulkAction || selectedIds.length === 0) return;

      const selectedCount = selectedIds.length;
      setPendingBulkAction("status");
      try {
        await axios.patch(
          API_BASE_URL + "/api/candidates/bulk",
          { ids: selectedIds, action: "updateStatus", status },
          { headers },
        );
        toast.success(
          "Đã cập nhật " + selectedCount + " ứng viên sang " + status,
        );
        setSelectedIds([]);
        requestRefresh();
      } catch {
        toast.error("Lỗi khi cập nhật hàng loạt");
      } finally {
        setPendingBulkAction(null);
      }
    },
    [
      headers,
      pendingBulkAction,
      requestRefresh,
      selectedIds,
    ],
  );

  const handleBulkDelete = useCallback(async () => {
    if (pendingBulkAction || selectedIds.length === 0) return;
    if (
      !window.confirm(
        "Xóa " + selectedIds.length + " ứng viên đã chọn?",
      )
    ) {
      return;
    }

    const selectedCount = selectedIds.length;
    setPendingBulkAction("delete");
    try {
      await axios.patch(
        API_BASE_URL + "/api/candidates/bulk",
        { ids: selectedIds, action: "delete" },
        { headers },
      );
      toast.success("Đã xóa " + selectedCount + " ứng viên");
      setSelectedIds([]);
      requestRefresh();
    } catch {
      toast.error("Lỗi khi xóa hàng loạt");
    } finally {
      setPendingBulkAction(null);
    }
  }, [
    headers,
    pendingBulkAction,
    requestRefresh,
    selectedIds,
  ]);

  const handleExport = useCallback(
    async (format: CandidateExportFormat) => {
      if (exportingFormat) return;

      setExportingFormat(format);
      try {
        if (format === "excel") {
          const response = await axios.get(
            API_BASE_URL + "/api/export/candidates.xlsx",
            { headers, responseType: "blob" },
          );
          downloadBlob(response.data, "danh_sach_ung_vien.xlsx");
          return;
        }

        const response = await axios.get(
          API_BASE_URL + "/api/export/report.pdf",
          { headers, responseType: "blob" },
        );
        downloadBlob(response.data, "bao_cao_tuyen_dung.pdf");
      } catch {
        toast.error(
          format === "excel"
            ? "Lỗi khi xuất Excel"
            : "Lỗi khi xuất PDF",
        );
      } finally {
        setExportingFormat(null);
      }
    },
    [exportingFormat, headers],
  );

  const handleDeleteCandidate = useCallback(
    async (candidateId: string) => {
      if (deletingCandidateId) return;
      if (!window.confirm("Bạn có chắc chắn muốn xóa ứng viên này?")) return;

      setDeletingCandidateId(candidateId);
      try {
        await axios.delete(
          API_BASE_URL + "/api/candidates/" + candidateId,
          { headers },
        );
        toast.success("Xóa ứng viên thành công!");
        requestRefresh();
      } catch (requestError: unknown) {
        if (axios.isAxiosError(requestError)) {
          toast.error(
            requestError.response?.data?.error || "Lỗi khi xóa ứng viên",
          );
        } else {
          toast.error("Lỗi khi xóa ứng viên");
        }
      } finally {
        setDeletingCandidateId(null);
      }
    },
    [
      deletingCandidateId,
      headers,
      requestRefresh,
    ],
  );

  return {
    jobs,
    isAdmin,
    candidates,
    pagination,
    loading,
    error,
    currentPage,
    searchTerm,
    setSearchTerm,
    selectedIds,
    showFilters,
    setShowFilters,
    filters,
    updateFilter,
    activeFilterCount,
    hasActiveCriteria,
    clearFilters,
    clearSearchAndFilters,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    pendingBulkAction,
    exportingFormat,
    deletingCandidateId,
    handlePageChange,
    handleBulkStatusUpdate,
    handleBulkDelete,
    handleExport,
    handleDeleteCandidate,
    retry: requestRefresh,
  };
}
