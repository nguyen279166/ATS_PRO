import prisma from "../../prisma";
import { saveCv } from "../../utils/cvStorage";
import { indexCandidateCv } from "../../utils/rag";

export const listPublicJobs = () =>
  prisma.job.findMany({
    where: { status: "Open" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      description: true,
      createdAt: true,
      user: { select: { fullName: true } },
    },
  });

type PublicApplicationInput = {
  jobId: string;
  name: string;
  email: string;
  file?: Express.Multer.File;
};

export const createPublicApplication = async ({
  jobId,
  name,
  email,
  file,
}: PublicApplicationInput) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "Open") return null;

  const storedCv = file ? await saveCv(file, name) : null;

  return prisma.candidate.create({
    data: {
      name,
      email,
      jobId,
      status: "Applied",
      ...(storedCv && storedCv),
    },
  });
};

export const indexPublicApplicationCv = (
  candidateId: string,
  file: Express.Multer.File,
) => indexCandidateCv(candidateId, file);
