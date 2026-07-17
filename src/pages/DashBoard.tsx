import { useData } from "../hooks/DataProvider";
import { ApplicationTrendChart } from "../features/dashboard/ApplicationTrendChart";
import { CandidateStatusDistribution } from "../features/dashboard/CandidateStatusDistribution";
import { CandidatesByJobChart } from "../features/dashboard/CandidatesByJobChart";
import { buildDashboardData } from "../features/dashboard/dashboardData";
import { DashboardLoadingState } from "../features/dashboard/DashboardLoadingState";
import { DashboardMetrics } from "../features/dashboard/DashboardMetrics";
import { RecentCandidates } from "../features/dashboard/RecentCandidates";
import { RecruitmentPipeline } from "../features/dashboard/RecruitmentPipeline";

export default function Dashboard() {
  const { jobs, candidates, loading } = useData();

  if (loading) {
    return <DashboardLoadingState />;
  }

  const dashboard = buildDashboardData(jobs, candidates);

  return (
    <div className='min-w-0 space-y-6'>
      <h1 className='sr-only'>Tổng quan tuyển dụng</h1>

      <DashboardMetrics metrics={dashboard.metrics} />

      <div className='grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12'>
        <div className='min-w-0 xl:col-span-7'>
          <ApplicationTrendChart data={dashboard.monthlyApplications} />
        </div>
        <div className='min-w-0 xl:col-span-5'>
          <CandidateStatusDistribution data={dashboard.statusDistribution} />
        </div>
      </div>

      <div className='grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12'>
        <div className='min-w-0 xl:col-span-7'>
          <CandidatesByJobChart data={dashboard.candidatesByJob} />
        </div>
        <div className='min-w-0 xl:col-span-5'>
          <RecruitmentPipeline data={dashboard.pipeline} />
        </div>
      </div>

      <RecentCandidates candidates={dashboard.recentCandidates} />
    </div>
  );
}
