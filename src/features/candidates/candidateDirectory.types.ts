export interface CandidatePaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CandidateFilters {
  status: string;
  jobId: string;
  dateFrom: string;
  dateTo: string;
}

export type CandidateFilterKey = keyof CandidateFilters;
export type CandidateExportFormat = "excel" | "pdf";
export type CandidateBulkAction = "status" | "delete";
