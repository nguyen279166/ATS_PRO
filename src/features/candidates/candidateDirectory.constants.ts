import type { CandidateStatus } from "../../types";

export const CANDIDATE_PAGE_LIMIT = 10;

export const CANDIDATE_STATUSES: readonly CandidateStatus[] = [
  "Applied",
  "Interviewing",
  "Hired",
  "Rejected",
];

export const CANDIDATE_STATUS_CLASSES: Record<CandidateStatus, string> = {
  Applied: "sahara-status sahara-status-applied",
  Interviewing: "sahara-status sahara-status-interviewing",
  Hired: "sahara-status sahara-status-hired",
  Rejected: "sahara-status sahara-status-rejected",
};
