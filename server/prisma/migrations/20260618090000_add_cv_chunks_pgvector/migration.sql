CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "CandidateCvChunk" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateCvChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CandidateCvChunk_candidateId_idx" ON "CandidateCvChunk"("candidateId");
CREATE INDEX "CandidateCvChunk_embedding_idx"
  ON "CandidateCvChunk"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE "CandidateCvChunk"
ADD CONSTRAINT "CandidateCvChunk_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
