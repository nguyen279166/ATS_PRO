export type RetrievalEvaluationCase = {
  id: string;
  question: string;
  expectedEvidence: string[];
};

export type RetrievalEvaluationItem = RetrievalEvaluationCase & {
  rankedContents: string[];
};

export type RetrievalEvaluationMetrics = {
  recallAtK: number;
  meanReciprocalRank: number;
  citationPrecisionAtK: number;
  evaluatedQuestions: number;
  k: number;
};

function normalizeForEvaluation(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsEvidence(content: string, evidence: string) {
  return normalizeForEvaluation(content).includes(
    normalizeForEvaluation(evidence),
  );
}

export function evaluateRetrieval(
  items: RetrievalEvaluationItem[],
  k = 5,
): RetrievalEvaluationMetrics {
  if (items.length === 0) {
    return {
      recallAtK: 0,
      meanReciprocalRank: 0,
      citationPrecisionAtK: 0,
      evaluatedQuestions: 0,
      k,
    };
  }

  let totalRecall = 0;
  let totalReciprocalRank = 0;
  let totalCitationPrecision = 0;

  for (const item of items) {
    const topContents = item.rankedContents.slice(0, k);
    const foundEvidence = item.expectedEvidence.filter((evidence) =>
      topContents.some((content) => containsEvidence(content, evidence)),
    );
    const firstRelevantIndex = topContents.findIndex((content) =>
      item.expectedEvidence.some((evidence) =>
        containsEvidence(content, evidence),
      ),
    );
    const relevantCitations = topContents.filter((content) =>
      item.expectedEvidence.some((evidence) =>
        containsEvidence(content, evidence),
      ),
    ).length;

    totalRecall += foundEvidence.length / item.expectedEvidence.length;
    totalReciprocalRank +=
      firstRelevantIndex >= 0 ? 1 / (firstRelevantIndex + 1) : 0;
    totalCitationPrecision +=
      topContents.length > 0 ? relevantCitations / topContents.length : 0;
  }

  return {
    recallAtK: totalRecall / items.length,
    meanReciprocalRank: totalReciprocalRank / items.length,
    citationPrecisionAtK: totalCitationPrecision / items.length,
    evaluatedQuestions: items.length,
    k,
  };
}
