import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import prisma from "../prisma";

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
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

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  const client = getOpenAiClient();
  if (!client) return null;

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });

  return response.data[0]?.embedding || null;
}

export async function indexCandidateCv(
  candidateId: string,
  file: Express.Multer.File,
) {
  const client = getOpenAiClient();
  if (!client) return { indexed: false, reason: "OPENAI_API_KEY is not configured" };

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

    for (const chunk of embeddedChunks) {
      await tx.$executeRawUnsafe(
        `
          INSERT INTO "CandidateCvChunk" ("id", "candidateId", "content", "chunkIndex", "embedding")
          VALUES ($1, $2, $3, $4, $5::vector)
        `,
        randomUUID(),
        candidateId,
        chunk.content,
        chunk.chunkIndex,
        vectorToSql(chunk.embedding),
      );
    }
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
  const client = getOpenAiClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const questionEmbedding = await createEmbedding(question);
  if (!questionEmbedding) {
    throw new Error("Could not create question embedding");
  }

  const sources = await prisma.$queryRawUnsafe<RagSource[]>(
    `
      SELECT
        "chunkIndex",
        "content",
        1 - ("embedding" <=> $2::vector) AS "score"
      FROM "CandidateCvChunk"
      WHERE "candidateId" = $1
      ORDER BY "embedding" <=> $2::vector
      LIMIT 5
    `,
    candidateId,
    vectorToSql(questionEmbedding),
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

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an HR assistant. Answer only from the provided CV context. If the answer is not in the context, say you do not have enough information.",
      },
      {
        role: "user",
        content: `CV context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return {
    answer:
      response.choices[0]?.message?.content?.trim() ||
      "Khong the tao cau tra loi tu CV.",
    sources,
  };
}
