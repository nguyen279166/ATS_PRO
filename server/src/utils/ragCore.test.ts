import { describe, expect, it } from "vitest";
import {
  buildOllamaEmbeddingInput,
  CHUNKING_VERSION,
  chunkCvText,
  detectCvSectionHeading,
  getGeminiEmbeddingTaskType,
  MAX_CHUNK_CHARS,
  normalizeDocumentText,
  reciprocalRankFusionScore,
} from "./ragCore";

describe("RAG core", () => {
  it("preserves document structure and restores legacy inline headings", () => {
    const normalized = normalizeDocumentText(
      "NGUYEN VAN A  SUMMARY Backend developer. TECHNICAL SKILLS Node.js, PostgreSQL. PROJECTS ATS Pro",
    );

    expect(normalized).toContain("\nSUMMARY\n");
    expect(normalized).toContain("\nTECHNICAL SKILLS\n");
    expect(normalized).toContain("\nPROJECTS\n");
  });

  it("detects common English and Vietnamese section headings", () => {
    expect(detectCvSectionHeading("WORK EXPERIENCE")).toMatchObject({
      section: "experience",
    });
    expect(detectCvSectionHeading("KY NANG")).toMatchObject({
      section: "skills",
    });
    expect(detectCvSectionHeading("A normal project sentence")).toBeNull();
  });

  it("creates section-aware chunks with stable metadata", () => {
    const chunks = chunkCvText(`
NGUYEN VAN A
nguyen@example.com

SUMMARY
Backend developer focused on reliable APIs.

SKILLS
Node.js, PostgreSQL, Redis, Docker.

PROJECTS
ATS Pro uses pgvector for CV retrieval.
URL Shortener uses Redis cache-aside.

EDUCATION
Bachelor of Information Technology at PTIT.
`);

    expect(chunks.map((chunk) => chunk.section)).toEqual([
      "contact",
      "summary",
      "skills",
      "projects",
      "education",
    ]);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(chunks[2]).toMatchObject({ heading: "SKILLS" });
    expect(chunks[2]?.content).toContain("Redis");
    expect(CHUNKING_VERSION).toBe("section-v2");
  });

  it("keeps long section chunks within the configured size", () => {
    const longExperience = Array.from(
      { length: 120 },
      (_, index) => `Built backend feature ${index} with tests and monitoring.`,
    ).join(" ");
    const chunks = chunkCvText(`EXPERIENCE\n${longExperience}`);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= MAX_CHUNK_CHARS)).toBe(
      true,
    );
    expect(chunks.every((chunk) => chunk.section === "experience")).toBe(true);
  });

  it("does not create repeated overlap chunks for a short multi-sentence section", () => {
    const chunks = chunkCvText(
      "SUMMARY\nBuilt backend APIs. Worked with PostgreSQL. Deployed with Docker.",
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("Deployed with Docker.");
  });

  it("uses task-aware instructions for Nomic and Gemini embeddings", () => {
    expect(
      buildOllamaEmbeddingInput("nomic-embed-text", "Node.js", "document"),
    ).toBe("search_document: Node.js");
    expect(
      buildOllamaEmbeddingInput("nomic-embed-text", "Node.js?", "query"),
    ).toBe("search_query: Node.js?");
    expect(buildOllamaEmbeddingInput("mxbai-embed", "Node.js", "query")).toBe(
      "Node.js",
    );
    expect(getGeminiEmbeddingTaskType("document")).toBe("RETRIEVAL_DOCUMENT");
    expect(getGeminiEmbeddingTaskType("query")).toBe("RETRIEVAL_QUERY");
  });

  it("rewards results found by both vector and full-text retrieval", () => {
    const both = reciprocalRankFusionScore(1, 2);
    const vectorOnly = reciprocalRankFusionScore(1, null);
    const textOnly = reciprocalRankFusionScore(null, 1);

    expect(both).toBeGreaterThan(vectorOnly);
    expect(both).toBeGreaterThan(textOnly);
  });
});
