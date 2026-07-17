import type { CandidateStatus } from "../../types";
import type { CandidatePanelTab, KanbanColumnConfig } from "./types";

export const KANBAN_COLUMNS: readonly KanbanColumnConfig[] = [
  {
    status: "Applied",
    label: "Mới ứng tuyển",
    description: "Hồ sơ chờ đánh giá",
    accentClass: "border-t-[var(--color-border)]",
    badgeClass: "sahara-status-applied",
  },
  {
    status: "Interviewing",
    label: "Đang phỏng vấn",
    description: "Đang trao đổi chuyên môn",
    accentClass: "border-t-[var(--sahara-primary)]",
    badgeClass: "sahara-status-interviewing",
  },
  {
    status: "Hired",
    label: "Đã tuyển",
    description: "Hoàn tất quy trình",
    accentClass: "border-t-[var(--sahara-secondary)]",
    badgeClass: "sahara-status-hired",
  },
  {
    status: "Rejected",
    label: "Từ chối",
    description: "Hồ sơ đã đóng",
    accentClass: "border-t-[var(--color-danger)]",
    badgeClass: "sahara-status-rejected",
  },
] as const;

export const CANDIDATE_PANEL_TABS: readonly {
  key: CandidatePanelTab;
  label: string;
}[] = [
  { key: "notes", label: "Ghi chú" },
  { key: "interviews", label: "Lịch PV" },
  { key: "cv", label: "CV" },
  { key: "ai", label: "AI" },
] as const;

export const getCandidateStatusLabel = (status: CandidateStatus) =>
  KANBAN_COLUMNS.find((column) => column.status === status)?.label ?? status;
