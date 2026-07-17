import prisma from "../../prisma";

export type JobInput = {
  title: string;
  department: string;
  location: string;
  description?: string | null;
};

export const listJobs = () =>
  prisma.job.findMany({
    include: {
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const createJob = (input: JobInput, userId: string) =>
  prisma.job.create({
    data: { ...input, userId },
  });

export const updateJob = (id: string, input: JobInput) =>
  prisma.job.update({
    where: { id },
    data: input,
  });

export const deleteJob = (id: string) =>
  prisma.job.delete({ where: { id } });
