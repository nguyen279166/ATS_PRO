export const MAX_CHUNK_CHARS = 1200;
export const CHUNK_OVERLAP_CHARS = 180;
export const CHUNKING_VERSION = "section-v2";
export const EMBEDDING_VERSION = "retrieval-task-v1";
export const RRF_K = 60;

export type EmbeddingTask = "document" | "query";

export type CvSection =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "languages"
  | "awards"
  | "other";

export type CvChunk = {
  content: string;
  chunkIndex: number;
  section: CvSection;
  heading: string | null;
};

const INLINE_SECTION_HEADINGS = [
  "PROFESSIONAL SUMMARY",
  "WORK EXPERIENCE",
  "TECHNICAL SKILLS",
  "SKILLS & ADDITIONAL INFORMATION",
  "PERSONAL INFORMATION",
  "CERTIFICATIONS",
  "CERTIFICATES",
  "ACHIEVEMENTS",
  "EXPERIENCE",
  "EDUCATION",
  "PROJECTS",
  "LANGUAGES",
  "SUMMARY",
  "PROFILE",
  "SKILLS",
  "AWARDS",
  "CONTACT",
];

const SECTION_ALIASES: Array<{
  section: CvSection;
  aliases: string[];
}> = [
  {
    section: "contact",
    aliases: ["contact", "personal information", "thong tin ca nhan"],
  },
  {
    section: "summary",
    aliases: [
      "summary",
      "professional summary",
      "profile",
      "objective",
      "career objective",
      "gioi thieu",
      "muc tieu nghe nghiep",
    ],
  },
  {
    section: "skills",
    aliases: [
      "skills",
      "technical skills",
      "skills and additional information",
      "additional information",
      "ky nang",
      "ky nang chuyen mon",
    ],
  },
  {
    section: "experience",
    aliases: [
      "experience",
      "work experience",
      "employment",
      "professional experience",
      "kinh nghiem",
      "kinh nghiem lam viec",
    ],
  },
  {
    section: "projects",
    aliases: ["projects", "project experience", "personal projects", "du an"],
  },
  {
    section: "education",
    aliases: ["education", "academic background", "hoc van"],
  },
  {
    section: "certifications",
    aliases: ["certifications", "certificates", "licenses", "chung chi"],
  },
  {
    section: "languages",
    aliases: ["languages", "language", "ngoai ngu", "ngon ngu"],
  },
  {
    section: "awards",
    aliases: ["awards", "achievements", "honors", "giai thuong", "thanh tich"],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function restoreInlineSectionBreaks(value: string) {
  const headings = INLINE_SECTION_HEADINGS.map(escapeRegExp).join("|");
  const pattern = new RegExp(`([^\\n])\\s+(${headings})(?=\\s|:)`, "g");
  return value.replace(pattern, "$1\n$2\n");
}

export function normalizeDocumentText(text: string) {
  const withLineBreaks = restoreInlineSectionBreaks(
    text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " "),
  );

  return withLineBreaks
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeHeading(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectCvSectionHeading(line: string) {
  const normalized = normalizeHeading(line);
  if (!normalized || normalized.length > 64) return null;

  for (const group of SECTION_ALIASES) {
    if (group.aliases.includes(normalized)) {
      return { section: group.section, heading: line.replace(/[:\s]+$/, "").trim() };
    }
  }

  return null;
}

function findChunkBoundary(text: string, start: number, hardEnd: number) {
  if (hardEnd >= text.length) return text.length;

  const minimumBoundary = start + (hardEnd - start) * 0.6;
  const lineBoundary = text.lastIndexOf("\n", hardEnd);
  const sentenceBoundary = text.lastIndexOf(". ", hardEnd);
  const bestBoundary = Math.max(
    lineBoundary,
    sentenceBoundary >= 0 ? sentenceBoundary + 1 : -1,
  );

  return bestBoundary > minimumBoundary ? bestBoundary : hardEnd;
}

function splitSectionBody(body: string, heading: string | null) {
  const prefix = heading ? `${heading}\n` : "";
  const maxBodyChars = Math.max(240, MAX_CHUNK_CHARS - prefix.length);
  const chunks: string[] = [];
  let start = 0;

  while (start < body.length) {
    const hardEnd = Math.min(start + maxBodyChars, body.length);
    const end = findChunkBoundary(body, start, hardEnd);
    const content = `${prefix}${body.slice(start, end).trim()}`.trim();
    if (content) chunks.push(content);
    if (end >= body.length) break;

    const nextStart = Math.max(start + 1, end - CHUNK_OVERLAP_CHARS);
    const nextWhitespace = body.indexOf(" ", nextStart);
    start =
      nextWhitespace > nextStart && nextWhitespace < end
        ? nextWhitespace + 1
        : nextStart;
  }

  return chunks;
}

export function chunkCvText(text: string): CvChunk[] {
  const normalized = normalizeDocumentText(text);
  if (!normalized) return [];

  const sections: Array<{
    section: CvSection;
    heading: string | null;
    lines: string[];
  }> = [];
  let current = {
    section: "contact" as CvSection,
    heading: "Contact" as string | null,
    lines: [] as string[],
  };

  const flushCurrent = () => {
    const body = current.lines.join("\n").trim();
    if (body) sections.push({ ...current, lines: [...current.lines] });
  };

  for (const line of normalized.split("\n")) {
    if (!line) continue;
    const detected = detectCvSectionHeading(line);
    if (detected) {
      flushCurrent();
      current = { ...detected, lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  flushCurrent();

  if (sections.length === 0) {
    sections.push({ section: "other", heading: null, lines: [normalized] });
  }

  const chunks: CvChunk[] = [];
  for (const section of sections) {
    const body = section.lines.join("\n").trim();
    for (const content of splitSectionBody(body, section.heading)) {
      chunks.push({
        content,
        chunkIndex: chunks.length,
        section: section.section,
        heading: section.heading,
      });
    }
  }

  return chunks;
}

export function buildOllamaEmbeddingInput(
  model: string,
  input: string,
  task: EmbeddingTask,
) {
  if (!/nomic/i.test(model)) return input;
  const prefix = task === "document" ? "search_document" : "search_query";
  return `${prefix}: ${input}`;
}

export function getGeminiEmbeddingTaskType(task: EmbeddingTask) {
  return task === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY";
}

export function reciprocalRankFusionScore(
  vectorRank?: number | null,
  textRank?: number | null,
  k = RRF_K,
) {
  const vectorScore = vectorRank ? 1 / (k + vectorRank) : 0;
  const textScore = textRank ? 1 / (k + textRank) : 0;
  return vectorScore + textScore;
}
