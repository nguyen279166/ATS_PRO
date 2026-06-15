export type JobStatus = "Open" | "Closed" | "Draft";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  description?: string | null;
  status: JobStatus;
  createdAt: string;
  user?: { fullName: string };
  _count?: { candidates: number };
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
  cvUrl?: string | null;
  cvFileName?: string | null;
  job?: Job;
}
