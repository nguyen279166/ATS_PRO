import { describe, expect, it } from "vitest";
import { evaluateRetrieval } from "./ragEvaluation";

describe("RAG retrieval evaluation", () => {
  it("calculates recall, reciprocal rank and citation precision", () => {
    const metrics = evaluateRetrieval(
      [
        {
          id: "redis",
          question: "Which project uses Redis?",
          expectedEvidence: ["Redis cache-aside"],
          rankedContents: [
            "General backend skills",
            "URL Shortener uses Redis cache-aside",
            "Education at PTIT",
          ],
        },
        {
          id: "education",
          question: "Where did the candidate study?",
          expectedEvidence: ["PTIT"],
          rankedContents: ["Education at PTIT", "Node.js skills"],
        },
      ],
      3,
    );

    expect(metrics.recallAtK).toBe(1);
    expect(metrics.meanReciprocalRank).toBe(0.75);
    expect(metrics.citationPrecisionAtK).toBeCloseTo(5 / 12, 5);
  });

  it("returns zero metrics for an empty dataset", () => {
    expect(evaluateRetrieval([], 3)).toEqual({
      recallAtK: 0,
      meanReciprocalRank: 0,
      citationPrecisionAtK: 0,
      evaluatedQuestions: 0,
      k: 3,
    });
  });
});
