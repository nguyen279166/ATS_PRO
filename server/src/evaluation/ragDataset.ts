import type { RetrievalEvaluationCase } from "./ragEvaluation";

export const RAG_EVAL_CV = `
NGUYEN MINH ANH
minh.anh@example.com

SUMMARY
Backend-focused software engineering student who builds reliable web products.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Prisma, Redis and Docker.

EXPERIENCE
Backend Intern at Acme Labs from January 2025 to June 2025. Built REST APIs and implemented JWT authentication with role-based access control.

PROJECTS
ATS Pro: Built evidence-grounded CV search with pgvector and PostgreSQL.
URL Shortener: Implemented Redis cache-aside redirects, IP rate limiting and Docker deployment.

EDUCATION
Bachelor of Information Technology at PTIT, expected graduation in 2026.

CERTIFICATIONS
AWS Certified Cloud Practitioner. TOEIC 835.
`;

export const RAG_EVAL_CASES: RetrievalEvaluationCase[] = [
  {
    id: "backend-runtime",
    question: "Does the candidate have Node.js experience?",
    expectedEvidence: ["Node.js"],
  },
  {
    id: "redis-project",
    question: "Which project uses Redis cache-aside?",
    expectedEvidence: ["Redis cache-aside redirects"],
  },
  {
    id: "vector-search",
    question: "Has the candidate worked with pgvector?",
    expectedEvidence: ["CV search with pgvector"],
  },
  {
    id: "work-history",
    question: "Where did the candidate work as a backend intern?",
    expectedEvidence: ["Backend Intern at Acme Labs"],
  },
  {
    id: "authentication",
    question: "What authentication experience does the candidate have?",
    expectedEvidence: ["JWT authentication with role-based access control"],
  },
  {
    id: "education",
    question: "Where does the candidate study?",
    expectedEvidence: ["Information Technology at PTIT"],
  },
  {
    id: "graduation",
    question: "When is the candidate expected to graduate?",
    expectedEvidence: ["expected graduation in 2026"],
  },
  {
    id: "certification",
    question: "Does the candidate have an AWS certification?",
    expectedEvidence: ["AWS Certified Cloud Practitioner"],
  },
  {
    id: "rate-limiting",
    question: "Which project demonstrates rate limiting?",
    expectedEvidence: ["IP rate limiting"],
  },
  {
    id: "frontend",
    question: "Which frontend library is listed in the CV?",
    expectedEvidence: ["React"],
  },
];
