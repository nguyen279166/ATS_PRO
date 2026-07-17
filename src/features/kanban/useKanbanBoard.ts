import { useCallback, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "react-toastify";
import { useData } from "../../hooks/DataProvider";
import { useDebounce } from "../../hooks/useDebounce";
import type { Candidate, CandidateStatus, Job } from "../../types";
import { createCandidate, updateCandidateStatus } from "./api";
import { getCandidateStatusLabel } from "./constants";
import type {
  CandidatePanelTab,
  NewCandidateInput,
} from "./types";

type LocalCandidateState = {
  jobId?: string;
  candidates: Candidate[];
};

export const useKanbanBoard = (jobId: string | undefined) => {
  const {
    jobs,
    candidates: globalCandidates,
    loading,
    refreshData,
    updateCandidate,
  } = useData();
  const currentJob = jobs.find((job: Job) => job.id === jobId);
  const [localCandidateState, setLocalCandidateState] =
    useState<LocalCandidateState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<CandidatePanelTab>("notes");
  const [updatingCandidateIds, setUpdatingCandidateIds] = useState<Set<string>>(
    () => new Set(),
  );

  const globalJobCandidates = useMemo(
    () => globalCandidates.filter((candidate) => candidate.jobId === jobId),
    [globalCandidates, jobId],
  );
  const candidates =
    localCandidateState && localCandidateState.jobId === jobId
      ? localCandidateState.candidates
      : globalJobCandidates;
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const visibleCandidates = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return candidates;
    return candidates.filter((candidate) =>
      candidate.name.toLowerCase().includes(normalizedSearch),
    );
  }, [candidates, debouncedSearchTerm]);

  const getCurrentCandidates = useCallback(
    (previous: LocalCandidateState | null) =>
      previous && previous.jobId === jobId
        ? previous.candidates
        : candidates,
    [candidates, jobId],
  );

  const updateLocalCandidateStatus = useCallback(
    (candidateId: string, status: CandidateStatus) => {
      setLocalCandidateState((previous) => {
        const previousCandidates = getCurrentCandidates(previous);
        const movedCandidate = previousCandidates.find(
          (candidate) => candidate.id === candidateId,
        );
        if (!movedCandidate || movedCandidate.status === status) {
          return { jobId, candidates: previousCandidates };
        }

        return {
          jobId,
          candidates: [
            ...previousCandidates.filter(
              (candidate) => candidate.id !== candidateId,
            ),
            { ...movedCandidate, status },
          ],
        };
      });
    },
    [getCurrentCandidates, jobId],
  );

  const markCandidateUpdating = useCallback(
    (candidateId: string, updating: boolean) => {
      setUpdatingCandidateIds((previous) => {
        const next = new Set(previous);
        if (updating) next.add(candidateId);
        else next.delete(candidateId);
        return next;
      });
    },
    [],
  );

  const persistStatus = useCallback(
    async (candidateId: string, status: CandidateStatus) => {
      markCandidateUpdating(candidateId, true);
      try {
        const response = await updateCandidateStatus(candidateId, status);
        updateCandidate(candidateId, { status });

        const notification = response.data.notification;
        const statusLabel = getCandidateStatusLabel(status);
        if (notification?.delivery?.sent) {
          toast.success(
            `Đã chuyển sang ${statusLabel} và gửi email cho ứng viên`,
          );
        } else if (notification?.attempted) {
          toast.warning(
            "Trạng thái đã cập nhật nhưng email chưa gửi được. Kiểm tra cấu hình dịch vụ email.",
          );
        } else {
          toast.success(`Đã chuyển ứng viên sang ${statusLabel}`);
        }
      } finally {
        markCandidateUpdating(candidateId, false);
      }
    },
    [markCandidateUpdating, updateCandidate],
  );

  const saveStatusWithFeedback = useCallback(
    async (candidateId: string, status: CandidateStatus, errorContext: string) => {
      try {
        await persistStatus(candidateId, status);
      } catch (error) {
        console.error(errorContext, error);
        toast.error("Không thể cập nhật trạng thái ứng viên");
        try {
          await refreshData(false);
        } finally {
          setLocalCandidateState(null);
        }
      }
    },
    [persistStatus, refreshData],
  );

  const handleStatusChange = useCallback(
    async (candidateId: string, status: CandidateStatus) => {
      updateLocalCandidateStatus(candidateId, status);
      await saveStatusWithFeedback(
        candidateId,
        status,
        "Lỗi khi lưu trạng thái bằng bộ chọn:",
      );
    },
    [saveStatusWithFeedback, updateLocalCandidateStatus],
  );

  const handleDrop = useCallback(
    async (event: DragEvent, status: CandidateStatus) => {
      const candidateId = event.dataTransfer.getData("candidateId");
      if (!candidateId) return;
      updateLocalCandidateStatus(candidateId, status);
      await saveStatusWithFeedback(
        candidateId,
        status,
        "Lỗi khi lưu trạng thái kéo thả:",
      );
    },
    [saveStatusWithFeedback, updateLocalCandidateStatus],
  );

  const handleDropOnCard = useCallback(
    async (
      event: DragEvent,
      targetId: string,
      status: CandidateStatus,
    ) => {
      event.stopPropagation();
      const draggedId = event.dataTransfer.getData("candidateId");
      if (!draggedId || draggedId === targetId) return;

      setLocalCandidateState((previous) => {
        const previousCandidates = getCurrentCandidates(previous);
        const draggedIndex = previousCandidates.findIndex(
          (candidate) => candidate.id === draggedId,
        );
        const targetIndex = previousCandidates.findIndex(
          (candidate) => candidate.id === targetId,
        );
        if (draggedIndex === -1 || targetIndex === -1) {
          return { jobId, candidates: previousCandidates };
        }

        const nextCandidates = [...previousCandidates];
        const [draggedCandidate] = nextCandidates.splice(draggedIndex, 1);
        nextCandidates.splice(targetIndex, 0, {
          ...draggedCandidate,
          status,
        });
        return { jobId, candidates: nextCandidates };
      });

      await saveStatusWithFeedback(
        draggedId,
        status,
        "Lỗi khi lưu trạng thái kéo thả (đè thẻ):",
      );
    },
    [getCurrentCandidates, jobId, saveStatusWithFeedback],
  );

  const handleAddCandidate = useCallback(
    async (data: NewCandidateInput) => {
      try {
        const response = await createCandidate(jobId, data);
        const newCandidate: Candidate = {
          id: response.data.id,
          name: data.name,
          email: data.email,
          jobId: jobId || "",
          status: data.status,
          appliedDate:
            response.data.appliedDate ?? new Date().toISOString(),
        };
        setLocalCandidateState((previous) => ({
          jobId,
          candidates: [...getCurrentCandidates(previous), newCandidate],
        }));
        await refreshData();
      } catch (error) {
        console.error("Lỗi tạo candidate:", error);
      }
    },
    [getCurrentCandidates, jobId, refreshData],
  );

  const updateSelectedCandidate = useCallback(
    (candidateId: string, updates: Partial<Candidate>) => {
      setSelectedCandidate((previous) =>
        previous?.id === candidateId
          ? { ...previous, ...updates }
          : previous,
      );
      updateCandidate(candidateId, updates);
      setLocalCandidateState((previous) => ({
        jobId,
        candidates: getCurrentCandidates(previous).map((candidate) =>
          candidate.id === candidateId
            ? { ...candidate, ...updates }
            : candidate,
        ),
      }));
    },
    [getCurrentCandidates, jobId, updateCandidate],
  );

  const closeCandidate = useCallback(() => setSelectedCandidate(null), []);

  return {
    currentJob,
    loading,
    candidates,
    visibleCandidates,
    searchTerm,
    setSearchTerm,
    showModal,
    setShowModal,
    selectedCandidate,
    setSelectedCandidate,
    closeCandidate,
    activeTab,
    setActiveTab,
    updatingCandidateIds,
    handleStatusChange,
    handleDrop,
    handleDropOnCard,
    handleAddCandidate,
    updateSelectedCandidate,
  };
};
