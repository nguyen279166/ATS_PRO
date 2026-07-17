import prisma from "../../prisma";

export const listCandidatesForExcel = () =>
  prisma.candidate.findMany({
    include: { job: { select: { title: true, department: true } } },
    orderBy: { appliedDate: "desc" },
  });

export const getRecruitmentReportData = async () => {
  const [jobs, candidates] = await Promise.all([
    prisma.job.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.candidate.findMany({
      include: { job: { select: { title: true } } },
      orderBy: { appliedDate: "desc" },
    }),
  ]);

  return { jobs, candidates };
};
