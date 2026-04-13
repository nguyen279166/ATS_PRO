export type JobStatus = "Open" | "Closed" | "Draft";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  createdAt: string;
}

export type CandidataType = "Applied" | "Interviewing" | "Hired" | "Rejected";

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: CandidataType;
  appliedDate: string;
  avatar?: string;
}
