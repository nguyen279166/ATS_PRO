import "dotenv/config";
import { randomUUID } from "crypto";
import prisma from "../src/prisma";
import {
  RAG_EVAL_CASES,
  RAG_EVAL_CV,
} from "../src/evaluation/ragDataset";
import { evaluateRetrieval } from "../src/evaluation/ragEvaluation";
import {
  indexCandidateCvText,
  retrieveCandidateCvSources,
} from "../src/utils/rag";

const TOP_K = 3;

function percentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

async function main() {
  const suffix = randomUUID();
  const { user, job, candidate } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `rag-eval-${suffix}@example.com`,
        password: "evaluation-only",
        fullName: "RAG Evaluation",
      },
    });
    const job = await tx.job.create({
      data: {
        title: "Backend Developer",
        department: "Engineering",
        location: "Remote",
        description:
          "Build Node.js APIs with PostgreSQL, Redis, authentication and Docker.",
        userId: user.id,
      },
    });
    const candidate = await tx.candidate.create({
      data: {
        name: "Nguyen Minh Anh",
        email: `candidate-${suffix}@example.com`,
        jobId: job.id,
      },
    });

    return { user, job, candidate };
  });

  try {
    const indexed = await indexCandidateCvText(
      candidate.id,
      RAG_EVAL_CV,
      "eval-fixture",
    );
    if (!indexed.indexed) {
      throw new Error(indexed.reason || "Could not index the evaluation CV");
    }

    const items = [];
    const rows = [];
    for (const evaluationCase of RAG_EVAL_CASES) {
      const sources = await retrieveCandidateCvSources(
        candidate.id,
        evaluationCase.question,
      );
      const topSources = sources.slice(0, TOP_K);
      items.push({
        ...evaluationCase,
        rankedContents: topSources.map((source) => source.content),
      });
      rows.push({
        id: evaluationCase.id,
        topSection: topSources[0]?.section || "none",
        vectorScore: topSources[0]?.score.toFixed(3) || "0",
        rrfScore: topSources[0]?.hybridScore?.toFixed(4) || "0",
      });
    }

    const metrics = evaluateRetrieval(items, TOP_K);
    console.table(rows);
    console.table({
      [`Recall@${TOP_K}`]: percentage(metrics.recallAtK),
      MRR: metrics.meanReciprocalRank.toFixed(3),
      [`Citation precision@${TOP_K}`]: percentage(
        metrics.citationPrecisionAtK,
      ),
      Questions: metrics.evaluatedQuestions,
    });

    if (metrics.recallAtK < 0.8 || metrics.meanReciprocalRank < 0.7) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.candidate.delete({ where: { id: candidate.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
