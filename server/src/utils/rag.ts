import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";
import prisma from "../prisma";
import { Prisma } from "../../generated/prisma/client";

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
const GEMINI_CHAT_MODELS = (
  process.env.GEMINI_CHAT_MODELS ||
  process.env.GEMINI_CHAT_MODEL ||
  "gemini-2.5-flash-lite,gemini-2.5-flash"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const RAG_PROVIDER = (process.env.RAG_PROVIDER || "ollama").toLowerCase();
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2:3b";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNK_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 180;

type RagSource = {
  chunkIndex: number;
  content: string;
  score: number;
};

type RagAnswer = {
  answer: string;
  sources: RagSource[];
};

type EmbeddedChunk = {
  content: string;
  chunkIndex: number;
  embedding: number[];
};

type OllamaEmbeddingResponse = {
  embedding?: number[];
  embeddings?: number[][];
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
  response?: string;
};

function isRetryableAiError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const maybeCode = error as { code?: string; status?: number; type?: string };

  return (
    maybeCode.status === 429 ||
    maybeCode.status === 503 ||
    maybeCode.code === "insufficient_quota" ||
    maybeCode.code === "UNAVAILABLE" ||
    maybeCode.type === "insufficient_quota" ||
    message.includes("insufficient_quota") ||
    message.includes("exceeded your current quota") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded")
  );
}

export function getRagErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Khong the xu ly AI cho CV";

  const message = error.message.toLowerCase();
  const maybeCode = (error as { code?: string; status?: number; type?: string });

  if (
    maybeCode.status === 429 ||
    maybeCode.code === "insufficient_quota" ||
    maybeCode.type === "insufficient_quota" ||
    message.includes("insufficient_quota") ||
    message.includes("exceeded your current quota")
  ) {
    return "AI API key da het quota hoac chua bat billing. Neu dung Gemini, hay doi sang model con quota trong GEMINI_CHAT_MODELS.";
  }

  if (
    maybeCode.status === 503 ||
    maybeCode.code === "UNAVAILABLE" ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded")
  ) {
    return "Gemini dang qua tai tam thoi. Vui long thu lai sau vai phut.";
  }

  if (
    message.includes("incorrect api key") ||
    message.includes("invalid api key") ||
    message.includes("api key not valid")
  ) {
    return "AI API key khong hop le";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("ollama")
  ) {
    return "Ollama chua chay hoac chua co model. Hay mo Ollama va pull model can thiet.";
  }

  return error.message || "Khong the xu ly AI cho CV";
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function shouldUseOllama() {
  return RAG_PROVIDER !== "gemini";
}

function getOllamaUrl(path: string) {
  return `${OLLAMA_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function postOllama<T>(path: string, body: unknown) {
  const response = await fetch(getOllamaUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export async function extractCvText(file: Express.Multer.File) {
  const ext = getFileExtension(file.originalname);

  if (ext === "pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed.text || "");
    } finally {
      await parser.destroy();
    }
  }

  if (ext === "docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(parsed.value || "");
  }

  return "";
}

export function chunkText(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const hardEnd = Math.min(start + MAX_CHUNK_CHARS, normalized.length);
    let end = hardEnd;

    const sentenceBoundary = normalized.lastIndexOf(". ", hardEnd);
    if (sentenceBoundary > start + MAX_CHUNK_CHARS * 0.6) {
      end = sentenceBoundary + 1;
    }

    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP_CHARS);
  }

  return chunks.filter(Boolean);
}

function vectorToSql(vector: number[]) {
  return `[${vector.join(",")}]`;
}

function fitEmbeddingDimensions(vector: number[]) {
  if (vector.length === EMBEDDING_DIMENSIONS) return vector;
  if (vector.length > EMBEDDING_DIMENSIONS) {
    return vector.slice(0, EMBEDDING_DIMENSIONS);
  }

  return [...vector, ...Array(EMBEDDING_DIMENSIONS - vector.length).fill(0)];
}

async function createEmbedding(input: string) {
  if (shouldUseOllama()) {
    const response = await postOllama<OllamaEmbeddingResponse>("/api/embeddings", {
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: input,
    });
    const embedding = response.embedding || response.embeddings?.[0] || null;
    return embedding ? fitEmbeddingDimensions(embedding) : null;
  }

  const client = getGeminiClient();
  if (!client) return null;

  const response = await client.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: input,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values || null;
  return embedding ? fitEmbeddingDimensions(embedding) : null;
}

async function createChatAnswer(
  cvContext: string,
  jobContext: string,
  question: string,
) {
  const systemInstruction =
    [
      "You are an HR assistant for an ATS product.",
      "Answer only from the provided CV context and job description.",
      "If there is not enough information, say that clearly.",
      "When asked about fit, compare candidate evidence against the job requirements.",
      "Do not invent missing skills. Only list a gap if the job description explicitly requires it and the CV context does not show it.",
      "Use a concise structured format when judging fit: Mức độ phù hợp, Bằng chứng, Điểm còn thiếu, Gợi ý phỏng vấn.",
      "Reply in the same language as the user's question; if the question is Vietnamese, reply in Vietnamese.",
    ].join(" ");

  const prompt = `Job context:\n${jobContext || "No job description provided."}\n\nCV context:\n${cvContext}\n\nQuestion: ${question}`;

  if (shouldUseOllama()) {
    const response = await postOllama<OllamaChatResponse>("/api/chat", {
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      options: {
        temperature: 0.2,
      },
    });

    return (
      response.message?.content?.trim() ||
      response.response?.trim() ||
      "Khong the tao cau tra loi tu CV."
    );
  }

  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY is not configured");

  let lastError: unknown;
  for (const model of GEMINI_CHAT_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          systemInstruction,
        },
      });

      return response.text?.trim() || "Khong the tao cau tra loi tu CV.";
    } catch (error) {
      lastError = error;
      if (!isRetryableAiError(error)) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Khong the tao cau tra loi tu CV.");
}

export async function indexCandidateCv(
  candidateId: string,
  file: Express.Multer.File,
) {
  if (!shouldUseOllama() && !getGeminiClient()) {
    return {
      indexed: false,
      reason: "GEMINI_API_KEY is not configured",
    };
  }

  const text = await extractCvText(file);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await prisma.$executeRaw`
      DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
    `;
    return { indexed: false, reason: "CV text could not be extracted" };
  }

  const embeddedChunks: EmbeddedChunk[] = [];
  for (let index = 0; index < chunks.length; index++) {
    const embedding = await createEmbedding(chunks[index]);
    if (embedding) {
      embeddedChunks.push({ content: chunks[index], chunkIndex: index, embedding });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
    `;

    if (embeddedChunks.length === 0) return;

    const rows = embeddedChunks.map((chunk) =>
      Prisma.sql`(${randomUUID()}, ${candidateId}, ${chunk.content}, ${chunk.chunkIndex}, ${vectorToSql(chunk.embedding)}::vector)`,
    );

    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO "CandidateCvChunk" ("id", "candidateId", "content", "chunkIndex", "embedding")
        VALUES ${Prisma.join(rows)}
      `,
    );
  });

  return { indexed: embeddedChunks.length > 0, chunks: embeddedChunks.length };
}

export async function deleteCandidateCvIndex(candidateId: string) {
  await prisma.$executeRaw`
    DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
  `;
}

export async function askCandidateCv(
  candidateId: string,
  question: string,
): Promise<RagAnswer> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      name: true,
      job: {
        select: {
          title: true,
          department: true,
          location: true,
          description: true,
        },
      },
    },
  });

  const jobContext = candidate?.job
    ? [
        `Title: ${candidate.job.title}`,
        `Department: ${candidate.job.department}`,
        `Location: ${candidate.job.location}`,
        `Description: ${candidate.job.description || "No description"}`,
      ].join("\n")
    : "";

  const existingChunks = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "CandidateCvChunk"
    WHERE "candidateId" = ${candidateId}
  `;

  if (Number(existingChunks[0]?.count || 0) === 0) {
    return {
      answer:
        "Chua co noi dung CV duoc index cho ung vien nay. Hay upload lai CV dang PDF/DOCX roi thu hoi AI sau khi upload hoan tat.",
      sources: [],
    };
  }

  if (!shouldUseOllama() && !getGeminiClient()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const questionEmbedding = await createEmbedding(
    `${question}\n\nJob context:\n${jobContext}`,
  );
  if (!questionEmbedding) {
    throw new Error("Could not create question embedding");
  }

  const questionVector = vectorToSql(questionEmbedding);

  const sources = await prisma.$queryRaw<RagSource[]>(
    Prisma.sql`
      SELECT
        "chunkIndex",
        "content",
        1 - ("embedding" <=> ${questionVector}::vector) AS "score"
      FROM "CandidateCvChunk"
      WHERE "candidateId" = ${candidateId}
      ORDER BY "embedding" <=> ${questionVector}::vector
      LIMIT 5
    `,
  );

  if (sources.length === 0) {
    return {
      answer: "Chua co noi dung CV da duoc index cho ung vien nay.",
      sources: [],
    };
  }

  const cvContext = sources
    .map((source, index) => `[Source ${index + 1}]\n${source.content}`)
    .join("\n\n");

  return {
    answer: await createChatAnswer(cvContext, jobContext, question),
    sources,
  };
}
