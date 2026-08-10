ALTER TABLE "CandidateCvChunk"
ADD COLUMN "section" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN "heading" TEXT,
ADD COLUMN "chunkingVersion" TEXT NOT NULL DEFAULT 'legacy-v1',
ADD COLUMN "embeddingVersion" TEXT NOT NULL DEFAULT 'legacy-v1',
ADD COLUMN "searchVector" tsvector
GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, COALESCE("content", ''))) STORED;

CREATE INDEX "CandidateCvChunk_searchVector_idx"
ON "CandidateCvChunk"
USING GIN ("searchVector");

CREATE INDEX "CandidateCvChunk_retrievalVersion_idx"
ON "CandidateCvChunk"(
  "candidateId",
  "embeddingProvider",
  "embeddingModel",
  "chunkingVersion",
  "embeddingVersion"
);
