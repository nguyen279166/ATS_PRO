import { useState } from "react";
import { ApplicationDialog } from "../features/landing/ApplicationDialog";
import { LandingFooter } from "../features/landing/LandingFooter";
import { LandingHeader } from "../features/landing/LandingHeader";
import { LandingHero } from "../features/landing/LandingHero";
import { OpenJobsSection } from "../features/landing/OpenJobsSection";
import { useJobApplication } from "../features/landing/useJobApplication";
import { usePublicJobs } from "../features/landing/usePublicJobs";
import type { Job } from "../types";

export default function LandingPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const publicJobs = usePublicJobs();
  const application = useJobApplication({
    selectedJob,
    onSuccess: () => setSelectedJob(null),
  });

  const openApplication = (job: Job) => {
    application.clearSubmissionError();
    setSelectedJob(job);
  };

  const closeApplication = () => {
    application.clearSubmissionError();
    setSelectedJob(null);
  };

  return (
    <div className='sahara-public-shell min-h-dvh text-[var(--color-text)]'>
      <a href='#main-content' className='skip-link'>
        Chuyển đến nội dung chính
      </a>

      <LandingHeader />

      <main id='main-content' tabIndex={-1}>
        <LandingHero
          openJobsCount={publicJobs.jobs.length}
          jobsLoading={publicJobs.loading}
        />
        <OpenJobsSection
          jobs={publicJobs.jobs}
          loading={publicJobs.loading}
          error={publicJobs.error}
          onRetry={publicJobs.retry}
          onApply={openApplication}
        />
      </main>

      <LandingFooter />

      {selectedJob && (
        <ApplicationDialog
          job={selectedJob}
          application={application}
          onClose={closeApplication}
        />
      )}
    </div>
  );
}
