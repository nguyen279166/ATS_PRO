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
    candidateFindUnique: vi.fn(),
  };
});

vi.mock("../prisma", () => ({
  default: {
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
    candidate: {
      findUnique: mocks.candidateFindUnique,
    },
  },
}));

import {
  askCandidateCv,
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

  it("keeps all sections of a small CV available to factual answers", async () => {
    let chatPrompt = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        if (String(url).endsWith("/api/chat")) {
          const body = JSON.parse(String(init?.body || "{}")) as {
            messages?: Array<{ role: string; content: string }>;
          };
          chatPrompt =
            body.messages?.find((message) => message.role === "user")?.content ||
            "";
          return {
            ok: true,
            json: async () => ({
              message: {
                content:
                  "Có. CV ghi rõ: Availability: Full-time; available immediately.",
              },
            }),
            text: async () => "",
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({ embedding: [0.1, 0.2, 0.3] }),
          text: async () => "",
        } as Response;
      }),
    );
    mocks.candidateFindUnique.mockResolvedValue({
      name: "Nguyen Chung Nguyen",
      job: null,
    });
    mocks.queryRaw
      .mockResolvedValueOnce([{ count: 2n }])
      .mockResolvedValueOnce([
        {
          chunkIndex: 0,
          content: "SUMMARY\nFull-stack developer intern",
          section: "summary",
          heading: "SUMMARY",
          score: 0.72,
          textScore: 0,
          vectorRank: 1,
          textRank: null,
          hybridScore: 0.016,
        },
        {
          chunkIndex: 4,
          content:
            "ADDITIONAL INFORMATION\nAvailability: Full-time; available immediately",
          section: "skills",
          heading: "ADDITIONAL INFORMATION",
          score: 0.2,
          textScore: 0,
          vectorRank: 2,
          textRank: null,
          hybridScore: 0.015,
        },
      ]);

    const result = await askCandidateCv(
      "candidate-1",
      "Ứng viên có thể làm full-time không?",
    );

    expect(chatPrompt).toContain("<candidate_cv>");
    expect(chatPrompt).toContain(
      "Availability: Full-time; available immediately",
    );
    expect(result.answer).toContain("Full-time");
    expect(result.sources).toHaveLength(1);
  });
});
