import type { CandidateStatus } from "../../types";
import { CANDIDATE_STATUS_CLASSES } from "./candidateDirectory.constants";

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
}

export function CandidateStatusBadge({
  status,
}: CandidateStatusBadgeProps) {
  return (
    <span className={CANDIDATE_STATUS_CLASSES[status]}>
      {status}
    </span>
  );
}
