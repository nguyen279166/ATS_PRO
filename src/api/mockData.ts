import type { Candidate, Job } from "../types";

// Dữ liệu giả cho Tin tuyển dụng
export const mockJobs: Job[] = [
  {
    id: "JOB-01",
    title: "Frontend Developer (React/TS)",
    department: "Engineering",
    location: "Remote",
    status: "Open",
    createdAt: "2026-04-10",
  },
  {
    id: "JOB-02",
    title: "UX/UI Designer",
    department: "Design",
    location: "Hồ Chí Minh",
    status: "Open",
    createdAt: "2026-04-12",
  },
];

// Dữ liệu giả cho Ứng viên (Gắn liền với Job bằng jobId)
export const mockCandidates: Candidate[] = [
  {
    id: "CAN-01",
    jobId: "JOB-01",
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    status: "Applied",
    appliedDate: "2026-04-13",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  },
  {
    id: "CAN-02",
    jobId: "JOB-01",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    status: "Interviewing",
    appliedDate: "2026-04-11",
    avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
  },
  {
    id: "CAN-03",
    jobId: "JOB-02",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    status: "Hired",
    appliedDate: "2026-04-05",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
];
