import type { Candidate, CandidateStatus, Job } from "../../types";

const STATUS_ORDER: CandidateStatus[] = [
  "Applied",
  "Interviewing",
  "Hired",
  "Rejected",
];

export const DASHBOARD_STATUS_META: Record<
  CandidateStatus,
  { label: string; color: string; statusClass: string }
> = {
  Applied: {
    label: "Mới nộp",
    color: "#718096",
    statusClass: "sahara-status-applied",
  },
  Interviewing: {
    label: "Đang phỏng vấn",
    color: "#DB6B2C",
    statusClass: "sahara-status-interviewing",
  },
  Hired: {
    label: "Đã tuyển",
    color: "var(--color-secondary)",
    statusClass: "sahara-status-hired",
  },
  Rejected: {
    label: "Đã từ chối",
    color: "var(--color-danger)",
    statusClass: "sahara-status-rejected",
  },
};

export type DashboardMetricsData = {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  hiredCount: number;
  interviewingCount: number;
  appliedCount: number;
  rejectedCount: number;
  hireRate: number;
};

export type MonthlyApplicationData = {
  month: string;
  count: number;
};

export type CandidateStatusData = {
  status: CandidateStatus;
  label: string;
  value: number;
  color: string;
};

export type CandidatesByJobData = {
  jobId: string;
  name: string;
  fullName: string;
  candidates: number;
};

export type PipelineData = {
  label: string;
  count: number;
  colorClass: string;
};

export type DashboardData = {
  metrics: DashboardMetricsData;
  monthlyApplications: MonthlyApplicationData[];
  statusDistribution: CandidateStatusData[];
  candidatesByJob: CandidatesByJobData[];
  pipeline: PipelineData[];
  recentCandidates: Candidate[];
};

const countCandidatesByStatus = (
  candidates: Candidate[],
  status: CandidateStatus,
) => candidates.filter((candidate) => candidate.status === status).length;

export const buildDashboardData = (
  jobs: Job[],
  candidates: Candidate[],
  now = new Date(),
): DashboardData => {
  const appliedCount = countCandidatesByStatus(candidates, "Applied");
  const interviewingCount = countCandidatesByStatus(
    candidates,
    "Interviewing",
  );
  const hiredCount = countCandidatesByStatus(candidates, "Hired");
  const rejectedCount = countCandidatesByStatus(candidates, "Rejected");
  const totalCandidates = candidates.length;

  const metrics: DashboardMetricsData = {
    totalJobs: jobs.length,
    openJobs: jobs.filter((job) => job.status === "Open").length,
    totalCandidates,
    hiredCount,
    interviewingCount,
    appliedCount,
    rejectedCount,
    hireRate:
      totalCandidates > 0
        ? Math.round((hiredCount / totalCandidates) * 100)
        : 0,
  };

  const candidatesByJob = jobs
    .map((job) => ({
      jobId: job.id,
      name:
        job.title.length > 15
          ? `${job.title.substring(0, 15)}…`
          : job.title,
      fullName: job.title,
      candidates: candidates.filter((candidate) => candidate.jobId === job.id)
        .length,
    }))
    .sort((first, second) => second.candidates - first.candidates)
    .slice(0, 8);

  const statusValues: Record<CandidateStatus, number> = {
    Applied: appliedCount,
    Interviewing: interviewingCount,
    Hired: hiredCount,
    Rejected: rejectedCount,
  };
  const statusDistribution = STATUS_ORDER.map((status) => ({
    status,
    label: DASHBOARD_STATUS_META[status].label,
    value: statusValues[status],
    color: DASHBOARD_STATUS_META[status].color,
  })).filter((item) => item.value > 0);

  const monthlyApplications = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1,
    );
    const count = candidates.filter((candidate) => {
      const appliedDate = new Date(candidate.appliedDate);
      return (
        appliedDate.getFullYear() === date.getFullYear() &&
        appliedDate.getMonth() === date.getMonth()
      );
    }).length;

    return {
      month: date.toLocaleDateString("vi-VN", {
        month: "short",
        year: "2-digit",
      }),
      count,
    };
  });

  const pipeline = [
    {
      label: "Nộp đơn",
      count: appliedCount + interviewingCount + hiredCount + rejectedCount,
      colorClass: "bg-[#718096]",
    },
    {
      label: "Phỏng vấn",
      count: interviewingCount + hiredCount,
      colorClass: "bg-[#DB6B2C]",
    },
    {
      label: "Đã tuyển",
      count: hiredCount,
      colorClass: "bg-[var(--color-secondary)]",
    },
    {
      label: "Đã từ chối",
      count: rejectedCount,
      colorClass: "bg-[var(--color-danger)]",
    },
  ];

  const recentCandidates = [...candidates]
    .sort(
      (first, second) =>
        new Date(second.appliedDate).getTime() -
        new Date(first.appliedDate).getTime(),
    )
    .slice(0, 6);

  return {
    metrics,
    monthlyApplications,
    statusDistribution,
    candidatesByJob,
    pipeline,
    recentCandidates,
  };
};
