import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";
import prisma from "../prisma";
import { Prisma } from "../../generated/prisma/client";

const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
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
    return "AI API key da het quota hoac chua bat billing";
  }

  if (
    message.includes("incorrect api key") ||
    message.includes("invalid api key") ||
    message.includes("api key not valid")
  ) {
    return "AI API key khong hop le";
  }

  return error.message || "Khong the xu ly AI cho CV";
}

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function getConfiguredProvider() {
  if (AI_PROVIDER === "openai") return getOpenAiClient() ? "openai" : null;
  if (AI_PROVIDER === "gemini") return getGeminiClient() ? "gemini" : null;
  if (getGeminiClient()) return "gemini";
  if (getOpenAiClient()) return "openai";
  return null;
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

async function createEmbedding(input: string) {
  const provider = getConfiguredProvider();
  if (provider === "gemini") {
    const client = getGeminiClient();
    if (!client) return null;

    const response = await client.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: input,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    return response.embeddings?.[0]?.values || null;
  }

  if (provider === "openai") {
    const client = getOpenAiClient();
    if (!client) return null;

    const response = await client.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input,
    });

    return response.data[0]?.embedding || null;
  }

  return null;
}

async function createChatAnswer(context: string, question: string) {
  const provider = getConfiguredProvider();
  const systemInstruction =
    "You are an HR assistant. Answer only from the provided CV context. If the answer is not in the context, say you do not have enough information.";

  if (provider === "gemini") {
    const client = getGeminiClient();
    if (!client) throw new Error("GEMINI_API_KEY is not configured");

    const response = await client.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: `CV context:\n${context}\n\nQuestion: ${question}`,
      config: {
        temperature: 0.2,
        systemInstruction,
      },
    });

    return response.text?.trim() || "Khong the tao cau tra loi tu CV.";
  }

  if (provider === "openai") {
    const client = getOpenAiClient();
    if (!client) throw new Error("OPENAI_API_KEY is not configured");

    const response = await client.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: `CV context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "Khong the tao cau tra loi tu CV."
    );
  }

  throw new Error("GEMINI_API_KEY is not configured");
}

export async function indexCandidateCv(
  candidateId: string,
  file: Express.Multer.File,
) {
  const provider = getConfiguredProvider();
  if (!provider) {
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

  if (!getConfiguredProvider()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const questionEmbedding = await createEmbedding(question);
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

  const context = sources
    .map((source, index) => `[Source ${index + 1}]\n${source.content}`)
    .join("\n\n");

  return {
    answer: await createChatAnswer(context, question),
    sources,
  };
}
