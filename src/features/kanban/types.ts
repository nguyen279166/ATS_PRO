import type { Candidate, CandidateStatus } from "../../types";

export type StatusUpdateResponse = {
  candidate: Candidate;
  notification: {
    attempted: boolean;
    delivery?: {
      sent: boolean;
      reason?: "not_configured" | "send_failed";
    };
  };
};

export type NewCandidateInput = {
  name: string;
  email: string;
  status: CandidateStatus;
};

export type CandidatePanelTab = "notes" | "interviews" | "cv" | "ai";

export type KanbanColumnConfig = {
  status: CandidateStatus;
  label: string;
  description: string;
  accentClass: string;
  badgeClass: string;
};
