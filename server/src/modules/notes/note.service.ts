import prisma from "../../prisma";

export class NoteNotFoundError extends Error {}
export class NoteForbiddenError extends Error {}

const userSummary = { select: { fullName: true, avatar: true } } as const;

export const listCandidateNotes = (candidateId: string) =>
  prisma.note.findMany({
    where: { candidateId },
    include: { user: userSummary },
    orderBy: { createdAt: "desc" },
  });

export const createNote = (
  candidateId: string,
  content: string,
  userId: string,
) =>
  prisma.note.create({
    data: { content, candidateId, userId },
    include: { user: userSummary },
  });

const assertNoteOwner = async (id: string, userId: string) => {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) throw new NoteNotFoundError();
  if (note.userId !== userId) throw new NoteForbiddenError();
};

export const updateNote = async (
  id: string,
  content: string,
  userId: string,
) => {
  await assertNoteOwner(id, userId);
  return prisma.note.update({
    where: { id },
    data: { content },
    include: { user: userSummary },
  });
};

export const deleteNote = async (id: string, userId: string) => {
  await assertNoteOwner(id, userId);
  return prisma.note.delete({ where: { id } });
};
