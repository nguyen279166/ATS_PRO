export type JobStatus = "Open" | "Closed" | "Draft";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  createdAt: string;
}

export type CandidateStatus = "Applied" | "Interviewing" | "Hired" | "Rejected";

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: CandidateStatus;
  appliedDate: string;
  avatar?: string;
}
