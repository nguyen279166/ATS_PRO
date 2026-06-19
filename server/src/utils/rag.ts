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
const RAG_EMBEDDING_PROVIDER = (
  process.env.RAG_EMBEDDING_PROVIDER || RAG_PROVIDER
).toLowerCase();
const RAG_CHAT_PROVIDER = (
  process.env.RAG_CHAT_PROVIDER || RAG_PROVIDER
).toLowerCase();
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.2:3b";
const GEMINI_OCR_MODEL =
  process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNK_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 180;
const MIN_EXTRACTED_TEXT_CHARS = 40;
const TOP_K_CHUNKS = 8;
const MAX_CANDIDATE_CHUNKS = 100;
const MIN_CHUNK_SCORE = 0.42;
const MIN_KEYWORD_VECTOR_SCORE = 0.25;
const WEAK_HYBRID_SCORE = 0.45;
const VECTOR_SCORE_WEIGHT = 0.8;
const KEYWORD_SCORE_WEIGHT = 0.2;
const EMBEDDING_BATCH_SIZE = 3;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const OCR_PROMPT =
  "Ban la OCR transcription. Chi copy nguyen van text nhin thay trong tai lieu. " +
  "KHONG tom tat, KHONG suy luan, KHONG them thong tin, KHONG doi nghe nghiep/vi tri. " +
  "Giu section headers, bullet points, email, so dien thoai, ky nang, du an. " +
  "Chi tra plain text.";

type RagSource = {
  chunkIndex: number;
  content: string;
  score: number;
  keywordScore?: number;
  hybridScore?: number;
  matchedKeywords?: string[];
};

type RagAnswer = {
  answer: string;
  sources: RagSource[];
  retrievalWarning?: string;
  retrievalMode?: "job" | "question";
};

type EmbeddedChunk = {
  content: string;
  chunkIndex: number;
  embedding: number[];
  embeddingProvider: RagProvider;
  embeddingModel: string;
};

type ExtractedCvText = {
  text: string;
  provider: "pdf-parse" | "mammoth" | "gemini-ocr" | "none";
};

type EmbeddingResult = {
  vector: number[];
  provider: RagProvider;
  model: string;
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

type RagProvider = "ollama" | "gemini";

function getProviderOrder(provider: string): RagProvider[] {
  if (provider === "gemini") return ["gemini"];
  if (provider === "ollama") return ["ollama"];
  return ["ollama", "gemini"];
}

function getEmbeddingProviderOrder() {
  return getProviderOrder(RAG_EMBEDDING_PROVIDER);
}

function getChatProviderOrder() {
  return getProviderOrder(RAG_CHAT_PROVIDER);
}

function hasGeminiProvider() {
  return Boolean(getGeminiClient());
}

function hasAnyConfiguredProvider() {
  return getEmbeddingProviderOrder().some((provider) => {
    if (provider === "gemini") return hasGeminiProvider();
    return true;
  });
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

async function checkOllamaHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(getOllamaUrl("/api/tags"), {
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as {
      models?: { name?: string; model?: string }[];
    };
    const models = (data.models || [])
      .map((model) => model.name || model.model || "")
      .filter(Boolean);

    return {
      ok: true,
      models,
      hasEmbeddingModel: models.some((model) =>
        model.startsWith(OLLAMA_EMBEDDING_MODEL),
      ),
      hasChatModel: models.some((model) => model.startsWith(OLLAMA_CHAT_MODEL)),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ollama unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getRagHealth() {
  const ollama = await checkOllamaHealth();

  return {
    provider: RAG_PROVIDER,
    embeddingProvider: RAG_EMBEDDING_PROVIDER,
    embeddingProviderOrder: getEmbeddingProviderOrder(),
    chatProvider: RAG_CHAT_PROVIDER,
    chatProviderOrder: getChatProviderOrder(),
    embeddingDimensions: EMBEDDING_DIMENSIONS,
    ollama: {
      baseUrl: OLLAMA_BASE_URL,
      embeddingModel: OLLAMA_EMBEDDING_MODEL,
      chatModel: OLLAMA_CHAT_MODEL,
      ...ollama,
    },
    gemini: {
      configured: hasGeminiProvider(),
      embeddingModel: GEMINI_EMBEDDING_MODEL,
      chatModels: GEMINI_CHAT_MODELS,
      ocrModel: GEMINI_OCR_MODEL,
    },
  };
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

const SEARCH_STOP_WORDS = new Set([
  "ai",
  "anh",
  "ban",
  "bat",
  "biet",
  "co",
  "con",
  "cong",
  "cua",
  "cv",
  "day",
  "duoc",
  "gi",
  "hay",
  "hop",
  "khong",
  "kinh",
  "ky",
  "la",
  "lam",
  "mot",
  "nang",
  "nay",
  "nhung",
  "noi",
  "phu",
  "nghiem",
  "the",
  "thi",
  "tin",
  "tom",
  "tot",
  "trong",
  "tat",
  "ung",
  "vien",
  "viec",
  "ve",
  "voi",
  "what",
  "which",
  "candidate",
  "experience",
  "skills",
]);

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractSearchKeywords(question: string) {
  const normalized = normalizeSearchText(question);
  const tokens = normalized.match(/[a-z0-9][a-z0-9.+#-]*/g) || [];

  return [...new Set(tokens)].filter(
    (token) =>
      token.length >= 2 &&
      !/^\d+$/.test(token) &&
      !SEARCH_STOP_WORDS.has(token),
  );
}

function scoreKeywordMatches(content: string, keywords: string[]) {
  if (keywords.length === 0) {
    return { keywordScore: 0, matchedKeywords: [] as string[] };
  }

  const normalizedContent = normalizeSearchText(content);
  const contentTokens = normalizedContent.match(/[a-z0-9][a-z0-9.+#-]*/g) || [];
  const exactTokens = new Set(contentTokens);
  const compactTokens = new Set(
    contentTokens.map((token) => token.replace(/[._\-/]/g, "")),
  );
  const matchedKeywords = keywords.filter((keyword) => {
    const compactKeyword = keyword.replace(/[._\-/]/g, "");
    return (
      exactTokens.has(keyword) ||
      (compactKeyword.length >= 2 && compactTokens.has(compactKeyword))
    );
  });

  return {
    keywordScore: matchedKeywords.length / keywords.length,
    matchedKeywords,
  };
}

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getMimeType(ext: string, fallback?: string) {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
  };

  return map[ext] || fallback || "application/octet-stream";
}

function getExtractionFailureReason(ext: string) {
  if (IMAGE_EXTENSIONS.has(ext) && !hasGeminiProvider()) {
    return "CV dang anh can GEMINI_API_KEY de OCR truoc khi index";
  }

  if (ext === "pdf") {
    return "PDF khong co text hoac scan chua OCR duoc. Can GEMINI_API_KEY.";
  }

  if (ext === "doc") {
    return "File .doc cu chua duoc ho tro. Hay luu lai .docx hoac PDF.";
  }

  return "Khong trich xuat duoc text tu CV";
}

async function extractTextWithGemini(buffer: Buffer, mimeType: string) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Can GEMINI_API_KEY de OCR anh hoac PDF scan");
  }

  const response = await client.models.generateContent({
    model: GEMINI_OCR_MODEL,
    contents: [
      {
        inlineData: {
          mimeType,
          data: buffer.toString("base64"),
        },
      },
      { text: OCR_PROMPT },
    ],
    config: {
      temperature: 0,
    },
  });

  return normalizeText(response.text || "");
}

async function extractCvTextWithMetadata(
  file: Express.Multer.File,
): Promise<ExtractedCvText> {
  const ext = getFileExtension(file.originalname);

  if (ext === "pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      const text = normalizeText(parsed.text || "");
      if (text.length >= MIN_EXTRACTED_TEXT_CHARS) {
        return { text, provider: "pdf-parse" };
      }
    } finally {
      await parser.destroy();
    }

    return {
      text: await extractTextWithGemini(file.buffer, "application/pdf"),
      provider: "gemini-ocr",
    };
  }

  if (ext === "docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return { text: normalizeText(parsed.value || ""), provider: "mammoth" };
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    return {
      text: await extractTextWithGemini(
        file.buffer,
        getMimeType(ext, file.mimetype),
      ),
      provider: "gemini-ocr",
    };
  }

  return { text: "", provider: "none" };
}

export async function extractCvText(file: Express.Multer.File) {
  const result = await extractCvTextWithMetadata(file);
  return result.text;
}

export async function fetchCvFileFromUrl(
  cvUrl: string,
  cvFileName?: string | null,
): Promise<Express.Multer.File> {
  const baseUrl = process.env.BASE_URL || "http://localhost:3001";
  const fetchUrl = cvUrl.startsWith("/uploads/")
    ? `${baseUrl.replace(/\/$/, "")}${cvUrl}`
    : cvUrl;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Khong tai duoc CV (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const originalname = cvFileName || cvUrl.split("/").pop() || "cv.pdf";
  const mimetype =
    response.headers.get("content-type") ||
    getMimeType(getFileExtension(originalname));

  return {
    fieldname: "cv",
    originalname,
    encoding: "7bit",
    mimetype,
    size: buffer.length,
    buffer,
    stream: undefined as unknown as Express.Multer.File["stream"],
    destination: "",
    filename: originalname,
    path: "",
  };
}

export async function reindexCandidateCvFromUrl(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      cvUrl: true,
      cvFileName: true,
      cvExtractedText: true,
      cvExtractionProvider: true,
    },
  });

  if (!candidate?.cvUrl) {
    return { indexed: false, reason: "Ung vien chua co CV" };
  }

  if (candidate.cvExtractedText?.trim()) {
    return indexCandidateCvText(
      candidateId,
      candidate.cvExtractedText,
      candidate.cvExtractionProvider || "cached",
    );
  }

  const file = await fetchCvFileFromUrl(candidate.cvUrl, candidate.cvFileName);
  return indexCandidateCv(candidateId, file);
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

async function embedChunksInBatches(chunks: string[]) {
  const embeddedChunks: EmbeddedChunk[] = [];

  for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (content, offset) => {
        const embedding = await createEmbedding(content);
        if (!embedding) return null;

        return {
          content,
          chunkIndex: start + offset,
          embedding: embedding.vector,
          embeddingProvider: embedding.provider,
          embeddingModel: embedding.model,
        };
      }),
    );

    for (const chunk of batchResults) {
      if (chunk) embeddedChunks.push(chunk);
    }
  }

  return embeddedChunks;
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

async function createOllamaEmbedding(input: string): Promise<EmbeddingResult | null> {
  const response = await postOllama<OllamaEmbeddingResponse>("/api/embeddings", {
    model: OLLAMA_EMBEDDING_MODEL,
    prompt: input,
  });
  const embedding = response.embedding || response.embeddings?.[0] || null;
  return embedding
    ? {
        vector: fitEmbeddingDimensions(embedding),
        provider: "ollama",
        model: OLLAMA_EMBEDDING_MODEL,
      }
    : null;
}

async function createGeminiEmbedding(input: string): Promise<EmbeddingResult | null> {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY is not configured");
  const response = await client.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: input,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values || null;
  return embedding
    ? {
        vector: fitEmbeddingDimensions(embedding),
        provider: "gemini",
        model: GEMINI_EMBEDDING_MODEL,
      }
    : null;
}

async function createEmbedding(input: string) {
  let lastError: unknown;

  for (const provider of getEmbeddingProviderOrder()) {
    try {
      if (provider === "gemini") {
        if (!hasGeminiProvider()) continue;
        return await createGeminiEmbedding(input);
      }

      return await createOllamaEmbedding(input);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

function isJobFitQuestion(question: string) {
  return /phù hợp|phu hop|fit|so sánh|so sanh|đối chiếu|doi chieu|match|tuyển cho|tuyen cho|công việc này|cong viec nay|vị trí này|vi tri nay|job này|job nay|đủ điều kiện|du dieu kien/i.test(
    question,
  );
}

async function createChatAnswer(
  cvContext: string,
  jobContext: string,
  question: string,
  includeJobContext: boolean,
  skipFactExtraction = false,
) {
  if (
    includeJobContext &&
    !skipFactExtraction &&
    getChatProviderOrder()[0] === "ollama"
  ) {
    const candidateFacts = await createChatAnswer(
      cvContext,
      "",
      [
        "Trích xuất tối đa 10 sự thật cụ thể về ứng viên từ CV.",
        "Mỗi dòng dùng dạng: - Sự thật | Bằng chứng: câu trích nguyên văn từ CV.",
        "Không suy luận, không thêm yêu cầu công việc, không nhắc kỹ năng không có trong CV.",
      ].join(" "),
      false,
      true,
    );

    return createChatAnswer(
      `Candidate facts extracted only from CV:\n${candidateFacts}`,
      jobContext,
      question,
      true,
      true,
    );
  }

  const baseRules = [
    "You are an HR assistant for an ATS product.",
    "CV context is the ONLY source of facts about the candidate.",
    "Never copy job requirements into candidate evidence.",
    "Never invent skills, roles, companies, or projects.",
    "If CV context does not mention something, say 'CV không đề cập'.",
    "For yes/no skill questions, scan CV context literally first. If the skill keyword appears in CV context, answer yes and cite that phrase.",
    "Do not say 'CV không đề cập' when the exact queried skill or phrase appears in CV context.",
    "When citing evidence, quote a short exact phrase from CV context in quotation marks.",
    "Use plain text only. Do not use Markdown markers such as **, __, #, or backticks.",
    "Keep the answer concise, preferably under 180 words.",
    "Reply in the same language as the user's question; if Vietnamese, reply in Vietnamese.",
  ];

  const fitRules = includeJobContext
    ? [
        "Compare CV evidence against job requirements separately.",
        "Bằng chứng must come only from CV context, never from job description.",
        "Điểm còn thiếu must be job requirements absent from CV context.",
        "Treat a missing exact tool as a gap, not as proof that a related capability is absent. For example, experience with another ORM is transferable evidence, while Prisma can still be listed as unverified.",
        "Use Cao when nearly all core requirements have direct evidence; use Trung bình when the core stack matches but some requirements or experience duration are unverified; use Thấp only when most core requirements lack evidence.",
        "Do not rate Thấp when the CV directly demonstrates several core responsibilities and technologies from the job.",
        "Before answering, check for contradictions: anything cited in Bằng chứng must never also appear in Điểm còn thiếu.",
        "Never put a requirement in Điểm còn thiếu when the same line admits that the CV mentions it.",
        "For partially covered requirements, list only the uncovered parts. For example, JWT or role-based access control is API security evidence; only rate limiting or data validation may remain unverified.",
        "Mức độ phù hợp must begin with exactly one rating: Cao, Trung bình, or Thấp, followed by one short explanation.",
        "Điểm phù hợp must be one integer from 0 to 10 in the format x/10 and must agree with the rating: Cao is 8-10, Trung bình is 5-7, and Thấp is 0-4.",
        "Every item in Bằng chứng must include a short exact quote from the candidate facts.",
        "Do not add extra sections such as Điểm cộng.",
        "Put each section on a new line using exactly these labels: Mức độ phù hợp:, Điểm phù hợp:, Bằng chứng:, Điểm còn thiếu:, Gợi ý phỏng vấn:.",
      ]
    : [
        "Ignore any job description completely.",
        "Answer only about what appears in CV context.",
        "Do not judge job fit unless explicitly asked.",
      ];

  const systemInstruction = [...baseRules, ...fitRules].join(" ");

  const prompt = includeJobContext
    ? `CV context:\n${cvContext}\n\nJob context:\n${jobContext || "No job description provided."}\n\nQuestion: ${question}`
    : `CV context:\n${cvContext}\n\nQuestion: ${question}`;

  const createOllamaChatAnswer = async () => {
    const response = await postOllama<OllamaChatResponse>("/api/chat", {
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      options: {
        temperature: 0,
      },
    });

    return (
      response.message?.content?.trim() ||
      response.response?.trim() ||
      "Khong the tao cau tra loi tu CV."
    );
  };

  const createGeminiChatAnswer = async () => {
    const client = getGeminiClient();
    if (!client) throw new Error("GEMINI_API_KEY is not configured");

    let lastGeminiError: unknown;
    for (const model of GEMINI_CHAT_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0,
            systemInstruction,
          },
        });

        return response.text?.trim() || "Khong the tao cau tra loi tu CV.";
      } catch (error) {
        lastGeminiError = error;
        if (!isRetryableAiError(error)) break;
      }
    }

    throw lastGeminiError instanceof Error
      ? lastGeminiError
      : new Error("Khong the tao cau tra loi tu CV.");
  };

  let lastError: unknown;
  for (const provider of getChatProviderOrder()) {
    try {
      if (provider === "gemini") {
        if (!hasGeminiProvider()) continue;
        return await createGeminiChatAnswer();
      }

      return await createOllamaChatAnswer();
    } catch (error) {
      lastError = error;
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
  if (!hasAnyConfiguredProvider()) {
    return {
      indexed: false,
      reason: "No AI provider is configured",
    };
  }

  const ext = getFileExtension(file.originalname);
  const extraction = await extractCvTextWithMetadata(file);
  const text = extraction.text;
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await prisma.$executeRaw`
      DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
    `;
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        cvExtractedText: null,
        cvExtractedAt: null,
        cvExtractionProvider: extraction.provider,
      },
    });
    return { indexed: false, reason: getExtractionFailureReason(ext) };
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      cvExtractedText: text,
      cvExtractedAt: new Date(),
      cvExtractionProvider: extraction.provider,
    },
  });

  return indexCandidateCvText(candidateId, text, extraction.provider);
}

async function indexCandidateCvText(
  candidateId: string,
  text: string,
  _extractionProvider: string,
) {
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await prisma.$executeRaw`
      DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
    `;
    return { indexed: false, reason: "Khong co text CV de index" };
  }

  const embeddedChunks = await embedChunksInBatches(chunks);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM "CandidateCvChunk" WHERE "candidateId" = ${candidateId}
    `;

    if (embeddedChunks.length === 0) return;

    const rows = embeddedChunks.map((chunk) =>
      Prisma.sql`(${randomUUID()}, ${candidateId}, ${chunk.content}, ${chunk.chunkIndex}, ${vectorToSql(chunk.embedding)}::vector, ${chunk.embeddingProvider}, ${chunk.embeddingModel})`,
    );

    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO "CandidateCvChunk" ("id", "candidateId", "content", "chunkIndex", "embedding", "embeddingProvider", "embeddingModel")
        VALUES ${Prisma.join(rows)}
      `,
    );
  });

  if (embeddedChunks.length === 0) {
    return {
      indexed: false,
      chunks: 0,
      reason: "Could not create embeddings for this CV",
    };
  }

  return {
    indexed: true,
    chunks: embeddedChunks.length,
    extractionProvider: _extractionProvider,
    embeddingProvider: embeddedChunks[0]?.embeddingProvider,
    embeddingModel: embeddedChunks[0]?.embeddingModel,
  };
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
  const includeJobContext = isJobFitQuestion(question);
  const retrievalMode = includeJobContext ? "job" : "question";
  const retrievalInput = includeJobContext
    ? `${question}\n\nJob requirements:\n${jobContext}`
    : question;

  const existingChunks = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "CandidateCvChunk"
    WHERE "candidateId" = ${candidateId}
  `;

  if (Number(existingChunks[0]?.count || 0) === 0) {
    return {
      answer:
        "Chua co noi dung CV duoc index. Hay upload lai CV (PDF/DOCX/PNG/JPG) hoac bam Index lai AI, roi thu hoi sau.",
      sources: [],
    };
  }

  if (!hasAnyConfiguredProvider()) {
    throw new Error("No AI provider is configured");
  }

  const questionEmbedding = await createEmbedding(retrievalInput);
  if (!questionEmbedding) {
    throw new Error("Could not create question embedding");
  }

  const questionVector = vectorToSql(questionEmbedding.vector);

  const vectorSources = await prisma.$queryRaw<RagSource[]>(
    Prisma.sql`
      SELECT
        "chunkIndex",
        "content",
        1 - ("embedding" <=> ${questionVector}::vector) AS "score"
      FROM "CandidateCvChunk"
      WHERE "candidateId" = ${candidateId}
        AND "embeddingProvider" = ${questionEmbedding.provider}
        AND "embeddingModel" = ${questionEmbedding.model}
      ORDER BY "embedding" <=> ${questionVector}::vector
      LIMIT ${MAX_CANDIDATE_CHUNKS}
    `,
  );

  if (vectorSources.length === 0) {
    const indexedProviders = await prisma.$queryRaw<
      { embeddingProvider: string; embeddingModel: string; count: bigint }[]
    >`
      SELECT "embeddingProvider", "embeddingModel", COUNT(*)::bigint AS count
      FROM "CandidateCvChunk"
      WHERE "candidateId" = ${candidateId}
      GROUP BY "embeddingProvider", "embeddingModel"
    `;

    const providerSummary = indexedProviders
      .map(
        (item) =>
          `${item.embeddingProvider}/${item.embeddingModel} (${Number(item.count)} chunk)`,
      )
      .join(", ");

    return {
      answer:
        `CV da duoc index bang provider khac (${providerSummary || "khong ro"}). ` +
        `Provider hien tai la ${questionEmbedding.provider}/${questionEmbedding.model}. ` +
        "Hay bam Index lai AI de dong bo embedding truoc khi hoi.",
      sources: [],
    };
  }

  const searchKeywords = extractSearchKeywords(retrievalInput);
  const rankedSources = vectorSources
    .map((source) => {
      const { keywordScore, matchedKeywords } = scoreKeywordMatches(
        source.content,
        searchKeywords,
      );
      const hybridScore =
        searchKeywords.length === 0
          ? source.score
          : source.score * VECTOR_SCORE_WEIGHT +
            keywordScore * KEYWORD_SCORE_WEIGHT;

      return {
        ...source,
        keywordScore,
        hybridScore,
        matchedKeywords,
      };
    })
    .sort((a, b) => b.hybridScore - a.hybridScore);

  const sources = rankedSources
    .filter(
      (source) =>
        source.score >= MIN_CHUNK_SCORE ||
        ((source.matchedKeywords?.length || 0) > 0 &&
          source.score >= MIN_KEYWORD_VECTOR_SCORE),
    )
    .slice(0, TOP_K_CHUNKS);
  const bestScore = rankedSources[0]?.hybridScore ?? 0;
  if (sources.length === 0) {
    return {
      answer:
        "CV da duoc index nhung cau hoi chua khop du doan nao. Hay hoi cu the hon ve kinh nghiem, ky nang, hoc van hoac du an trong CV.",
      sources: rankedSources.slice(0, 3),
      retrievalMode,
    };
  }

  const cvContext = sources
    .map((source, index) => `[Source ${index + 1} | chunk ${source.chunkIndex + 1}]\n${source.content}`)
    .join("\n\n");

  const retrievalWarning =
    bestScore < WEAK_HYBRID_SCORE
      ? "Độ khớp nguồn CV thấp; hãy mở phần nguồn trích để đối chiếu."
      : undefined;

  return {
    answer: await createChatAnswer(
      cvContext,
      jobContext,
      question,
      includeJobContext,
    ),
    sources,
    retrievalWarning,
    retrievalMode,
  };
}
