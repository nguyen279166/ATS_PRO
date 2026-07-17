import prisma from "../../prisma";

export class InterviewNotFoundError extends Error {}

const creatorSummary = { select: { fullName: true, avatar: true } } as const;

export type CreateInterviewInput = {
  candidateId: string;
  scheduledAt: string;
  location?: string | null;
  notes?: string | null;
};

export type UpdateInterviewInput = {
  scheduledAt?: string;
  location?: string | null;
  notes?: string | null;
  status?: string;
};

export const listCandidateInterviews = (candidateId: string) =>
  prisma.interview.findMany({
    where: { candidateId },
    include: { creator: creatorSummary },
    orderBy: { scheduledAt: "asc" },
  });

export const createInterview = (
  input: CreateInterviewInput,
  createdBy: string,
) =>
  prisma.interview.create({
    data: {
      candidateId: input.candidateId,
      scheduledAt: new Date(input.scheduledAt),
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      createdBy,
    },
    include: { creator: creatorSummary },
  });

const assertInterviewExists = async (id: string) => {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new InterviewNotFoundError();
};

export const updateInterview = async (
  id: string,
  input: UpdateInterviewInput,
) => {
  await assertInterviewExists(id);
  return prisma.interview.update({
    where: { id },
    data: {
      ...(input.scheduledAt && {
        scheduledAt: new Date(input.scheduledAt),
      }),
      ...(input.location !== undefined && {
        location: input.location?.trim() || null,
      }),
      ...(input.notes !== undefined && {
        notes: input.notes?.trim() || null,
      }),
      ...(input.status && { status: input.status }),
    },
    include: { creator: creatorSummary },
  });
};

export const deleteInterview = async (id: string) => {
  await assertInterviewExists(id);
  return prisma.interview.delete({ where: { id } });
};
