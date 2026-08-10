import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env.RAG_PROVIDER = "ollama";
  process.env.RAG_EMBEDDING_PROVIDER = "ollama";
  process.env.OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";
  process.env.OLLAMA_BASE_URL = "http://ollama.test";

  return {
    queryRaw: vi.fn(),
    transaction: vi.fn(),
    txExecuteRaw: vi.fn(),
  };
});

vi.mock("../prisma", () => ({
  default: {
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
  },
}));

import {
  indexCandidateCvText,
  retrieveCandidateCvSources,
} from "./rag";

function mockOllamaEmbedding() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || "{}")) as { prompt?: string };
    return {
      ok: true,
      json: async () => ({ embedding: [0.1, 0.2, 0.3] }),
      text: async () => "",
      requestPrompt: body.prompt,
    } as unknown as Response;
  });
}

describe("RAG indexing and retrieval integration boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ $executeRaw: mocks.txExecuteRaw }),
    );
  });

  it("embeds indexed chunks as documents and stores them in one transaction", async () => {
    const fetchMock = mockOllamaEmbedding();
    vi.stubGlobal("fetch", fetchMock);

    const result = await indexCandidateCvText(
      "candidate-1",
      "SKILLS\nNode.js and PostgreSQL\nPROJECTS\nATS Pro uses pgvector",
      "test",
    );

    const prompts = fetchMock.mock.calls.map(([, init]) => {
      const body = JSON.parse(String(init?.body || "{}")) as { prompt: string };
      return body.prompt;
    });
    expect(prompts).toHaveLength(2);
    expect(prompts.every((prompt) => prompt.startsWith("search_document: "))).toBe(
      true,
    );
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.txExecuteRaw).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      indexed: true,
      chunks: 2,
      chunkingVersion: "section-v2",
      embeddingVersion: "retrieval-task-v1",
    });
  });

  it("embeds questions as queries before running fused retrieval", async () => {
    const fetchMock = mockOllamaEmbedding();
    vi.stubGlobal("fetch", fetchMock);
    mocks.queryRaw.mockResolvedValue([
      {
        chunkIndex: 0,
        content: "SKILLS\nNode.js and PostgreSQL",
        section: "skills",
        heading: "SKILLS",
        score: 0.72,
        textScore: 0.4,
        vectorRank: 1,
        textRank: 1,
        hybridScore: 0.032,
      },
    ]);

    const sources = await retrieveCandidateCvSources(
      "candidate-1",
      "Does the candidate know Node.js?",
    );

    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body || "{}"),
    ) as { prompt: string };
    expect(requestBody.prompt).toBe(
      "search_query: Does the candidate know Node.js?",
    );
    expect(mocks.queryRaw).toHaveBeenCalledOnce();
    expect(sources[0]).toMatchObject({
      section: "skills",
      matchedKeywords: ["node.js"],
    });
  });
});
