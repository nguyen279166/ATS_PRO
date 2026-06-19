ALTER TABLE "Candidate"
ADD COLUMN "cvExtractedText" TEXT,
ADD COLUMN "cvExtractedAt" TIMESTAMP(3),
ADD COLUMN "cvExtractionProvider" TEXT;

ALTER TABLE "CandidateCvChunk"
ADD COLUMN "embeddingProvider" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "embeddingModel" TEXT NOT NULL DEFAULT 'unknown';

CREATE INDEX "CandidateCvChunk_candidateId_embeddingProvider_embeddingModel_idx"
ON "CandidateCvChunk"("candidateId", "embeddingProvider", "embeddingModel");
