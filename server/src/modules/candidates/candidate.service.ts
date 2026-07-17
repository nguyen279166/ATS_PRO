import prisma from "../../prisma";
import {
  deleteCv,
  saveCv,
} from "../../utils/cvStorage";
import {
  sendEmail,
  type EmailDeliveryResult,
} from "../../utils/mailer";
import {
  askCandidateCv as askCandidateCvWithRag,
  deleteCandidateCvIndex,
  getRagErrorMessage,
  indexCandidateCv,
  reindexCandidateCvFromUrl,
} from "../../utils/rag";
import { buildCandidateStatusEmail } from "./candidate.notifications";

export type CandidateStatus =
  | "Applied"
  | "Interviewing"
  | "Hired"
  | "Rejected";

export type CandidateListQuery = {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  jobId?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
};

export type CreateCandidateInput = {
  name: string;
  email: string;
  jobId: string;
  status?: string;
};

export type BulkCandidateInput = {
  ids?: unknown;
  action?: string;
  status?: string;
};

export type CandidateServiceDependencies = {
  candidate: typeof prisma.candidate;
  sendEmail: typeof sendEmail;
  deleteCv: typeof deleteCv;
  saveCv: typeof saveCv;
  indexCandidateCv: typeof indexCandidateCv;
  reindexCandidateCvFromUrl: typeof reindexCandidateCvFromUrl;
  deleteCandidateCvIndex: typeof deleteCandidateCvIndex;
  askCandidateCv: typeof askCandidateCvWithRag;
  getRagErrorMessage: typeof getRagErrorMessage;
};

export const defaultCandidateServiceDependencies: CandidateServiceDependencies = {
  candidate: prisma.candidate,
  sendEmail,
  deleteCv,
  saveCv,
  indexCandidateCv,
  reindexCandidateCvFromUrl,
  deleteCandidateCvIndex,
  askCandidateCv: askCandidateCvWithRag,
  getRagErrorMessage,
};

export const createCandidateService = (
  dependencies: CandidateServiceDependencies,
) => ({
  async listCandidates(query: CandidateListQuery) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(1000, parseInt(query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const status = query.status as string | undefined;
    const jobId = query.jobId as string | undefined;
    const dateFrom = query.dateFrom as string | undefined;
    const dateTo = query.dateTo as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (dateFrom || dateTo) {
      where.appliedDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && {
          lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
        }),
      };
    }

    const [candidates, total] = await Promise.all([
      dependencies.candidate.findMany({
        where,
        include: { job: true },
        orderBy: { appliedDate: "desc" },
        skip,
        take: limit,
      }),
      dependencies.candidate.count({ where }),
    ]);

    return {
      data: candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createCandidate(input: CreateCandidateInput) {
    const { name, email, jobId, status } = input;
    return dependencies.candidate.create({
      data: { name, email, jobId, status: status || "Applied" },
    });
  },

  async updateCandidateStatus(id: string, status: string) {
    const oldCandidate = await dependencies.candidate.findUnique({
      where: { id },
    });

    const updatedCandidate = await dependencies.candidate.update({
      where: { id },
      data: { status },
      include: { job: true },
    });

    let notification: {
      attempted: boolean;
      delivery?: EmailDeliveryResult;
    } = { attempted: false };

    if (oldCandidate?.status !== status) {
      const template = buildCandidateStatusEmail(
        status,
        updatedCandidate.name,
        updatedCandidate.job.title,
        updatedCandidate.job.department,
      );
      if (template) {
        notification = {
          attempted: true,
          delivery: await dependencies.sendEmail(
            updatedCandidate.email,
            template.subject,
            template.html,
          ),
        };
      }
    }

    return { candidate: updatedCandidate, notification };
  },

  async deleteCandidate(id: string) {
    const candidate = await dependencies.candidate.findUnique({
      where: { id },
    });
    if (!candidate) return false;

    await dependencies.deleteCv(candidate.cvUrl, candidate.cvPublicId);
    await dependencies.candidate.delete({ where: { id } });
    return true;
  },

  async bulkCandidates(input: BulkCandidateInput) {
    const { ids, action, status } = input;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        kind: "invalid" as const,
        error: "Cần truyền danh sách ids",
      };
    }

    const candidateIds = ids as string[];

    if (action === "updateStatus") {
      if (!status) {
        return {
          kind: "invalid" as const,
          error: "Cần truyền status",
        };
      }

      const candidatesBeforeUpdate = await dependencies.candidate.findMany({
        where: { id: { in: candidateIds }, status: { not: status } },
        include: { job: true },
      });
      await dependencies.candidate.updateMany({
        where: { id: { in: candidateIds } },
        data: { status: status as CandidateStatus },
      });

      const deliveries: EmailDeliveryResult[] = [];
      if (
        status === "Interviewing" ||
        status === "Hired" ||
        status === "Rejected"
      ) {
        for (const candidate of candidatesBeforeUpdate) {
          const template = buildCandidateStatusEmail(
            status,
            candidate.name,
            candidate.job.title,
            candidate.job.department,
          );
          if (template) {
            deliveries.push(
              await dependencies.sendEmail(
                candidate.email,
                template.subject,
                template.html,
              ),
            );
          }
        }
      }

      return {
        kind: "success" as const,
        body: {
          message: "Đã cập nhật " + candidateIds.length + " ứng viên",
          notification: {
            attempted: deliveries.length,
            sent: deliveries.filter((delivery) => delivery.sent).length,
            failed: deliveries.filter((delivery) => !delivery.sent).length,
          },
        },
      };
    }

    if (action === "delete") {
      const candidatesToDelete = await dependencies.candidate.findMany({
        where: { id: { in: candidateIds } },
        select: { cvUrl: true, cvPublicId: true },
      });
      await Promise.all(
        candidatesToDelete.map((candidate) =>
          dependencies.deleteCv(candidate.cvUrl, candidate.cvPublicId),
        ),
      );
      await dependencies.candidate.deleteMany({
        where: { id: { in: candidateIds } },
      });

      return {
        kind: "success" as const,
        body: {
          message: "Đã xóa " + candidateIds.length + " ứng viên",
        },
      };
    }

    return {
      kind: "invalid" as const,
      error: "action không hợp lệ",
    };
  },

  async uploadCandidateCv(id: string, file: Express.Multer.File) {
    const candidate = await dependencies.candidate.findUnique({
      where: { id },
    });
    if (!candidate) return null;

    await dependencies.deleteCv(candidate.cvUrl, candidate.cvPublicId);
    const storedCv = await dependencies.saveCv(file, candidate.name);
    const updatedCandidate = await dependencies.candidate.update({
      where: { id },
      data: storedCv,
    });

    let cvIndex: Awaited<ReturnType<typeof indexCandidateCv>>;
    try {
      cvIndex = await dependencies.indexCandidateCv(id, file);
    } catch (error) {
      console.error("Loi khi index CV:", error);
      cvIndex = {
        indexed: false,
        reason: dependencies.getRagErrorMessage(error),
      };
    }

    return { ...updatedCandidate, cvIndex };
  },

  async reindexCandidateCv(id: string) {
    const candidate = await dependencies.candidate.findUnique({
      where: { id },
    });
    if (!candidate?.cvUrl) return null;

    let cvIndex: Awaited<ReturnType<typeof reindexCandidateCvFromUrl>>;
    try {
      cvIndex = await dependencies.reindexCandidateCvFromUrl(id);
    } catch (error) {
      console.error("Loi khi reindex CV:", error);
      cvIndex = {
        indexed: false,
        reason: dependencies.getRagErrorMessage(error),
      };
    }

    return { ...candidate, cvIndex };
  },

  async deleteCandidateCv(id: string) {
    const candidate = await dependencies.candidate.findUnique({
      where: { id },
    });
    if (!candidate || !candidate.cvUrl) return null;

    await dependencies.deleteCv(candidate.cvUrl, candidate.cvPublicId);
    await dependencies.deleteCandidateCvIndex(id);

    return dependencies.candidate.update({
      where: { id },
      data: {
        cvUrl: null,
        cvPublicId: null,
        cvFileName: null,
        cvExtractedText: null,
        cvExtractedAt: null,
        cvExtractionProvider: null,
      },
    });
  },

  async askCandidateCv(id: string, question: string) {
    const candidate = await dependencies.candidate.findUnique({
      where: { id },
    });
    if (!candidate) return { found: false as const };

    return {
      found: true as const,
      result: await dependencies.askCandidateCv(id, question),
    };
  },

  formatRagError(error: unknown) {
    return dependencies.getRagErrorMessage(error);
  },
});

export type CandidateService = ReturnType<typeof createCandidateService>;

export const candidateService = createCandidateService(
  defaultCandidateServiceDependencies,
);
