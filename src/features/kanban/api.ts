import axios from "axios";
import { API_BASE_URL } from "../../config/env";
import type { Candidate, CandidateStatus } from "../../types";
import type { NewCandidateInput, StatusUpdateResponse } from "./types";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token_lay_duoc")}`,
});

export const updateCandidateStatus = (
  candidateId: string,
  status: CandidateStatus,
) =>
  axios.put<StatusUpdateResponse>(
    `${API_BASE_URL}/api/candidates/${candidateId}`,
    { status },
    { headers: getAuthHeaders() },
  );

export const createCandidate = (jobId: string | undefined, data: NewCandidateInput) =>
  axios.post<Candidate>(
    `${API_BASE_URL}/api/candidates`,
    {
      name: data.name,
      email: data.email,
      jobId,
      status: data.status,
    },
    { headers: getAuthHeaders() },
  );
