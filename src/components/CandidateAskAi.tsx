import { useEffect, useId, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient, isApiError } from "../api/client";

type RagSource = {
  chunkIndex: number;
  content: string;
  score: number;
  keywordScore?: number;
  hybridScore?: number;
  matchedKeywords?: string[];
};

type AskResponse = {
  answer: string;
  sources: RagSource[];
  retrievalWarning?: string;
  retrievalMode?: "job" | "question";
};

type CandidateAskAiProps = {
  candidateId: string;
  candidateName: string;
  resetKey?: string;
};

const suggestedQuestions = [
  "Tóm tắt CV ứng viên này",
  "Ứng viên này có phù hợp với công việc này không?",
  "Ứng viên có kinh nghiệm React không?",
  "Kỹ năng backend nổi bật là gì?",
];

const answerSectionLabels = [
  "Mức độ phù hợp",
  "Điểm phù hợp",
  "Bằng chứng",
  "Điểm còn thiếu",
  "Điểm cộng",
  "Gợi ý phỏng vấn",
  "Tóm tắt",
  "Kết luận",
];

function cleanMarkdown(value: string) {
  return value
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\x60([^\x60]+)\x60/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseAnswerSections(answer: string) {
  let normalizedAnswer = answer;
  for (const label of answerSectionLabels) {
    normalizedAnswer = normalizedAnswer
      .replaceAll("**" + label + ":**", "\n" + label + ":")
      .replaceAll("**" + label + "**:", "\n" + label + ":")
      .replaceAll("### " + label, "\n" + label + ":")
      .replaceAll("## " + label, "\n" + label + ":");
  }

  const sections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of normalizedAnswer.split("\n")) {
    const trimmed = cleanMarkdown(line).replace(/^[-*•]\s*/, "");
    const matchedLabel = answerSectionLabels.find((label) =>
      trimmed.toLowerCase().startsWith(label.toLowerCase() + ":"),
    );

    if (matchedLabel) {
      if (current) {
        sections.push({
          title: current.title,
          body: current.body.join("\n").trim(),
        });
      }
      current = {
        title: matchedLabel,
        body: [trimmed.slice(matchedLabel.length + 1).trim()].filter(Boolean),
      };
      continue;
    }

    if (current) {
      current.body.push(cleanMarkdown(line));
    } else if (trimmed) {
      current = { title: "Trả lời", body: [cleanMarkdown(line)] };
    }
  }

  if (current) {
    sections.push({
      title: current.title,
      body: current.body.join("\n").trim(),
    });
  }

  return sections.length > 0
    ? sections
    : [{ title: "Trả lời", body: cleanMarkdown(answer) }];
}

function AnswerBody({ body }: { body: string }) {
  const lines = body
    .split("\n")
    .map((line) => cleanMarkdown(line))
    .filter(Boolean);

  return (
    <div className='space-y-1.5'>
      {lines.map((line, index) => {
        const bullet = line.match(/^[-*•]\s+(.+)/);
        const numbered = line.match(/^\d+[.)]\s+(.+)/);
        const content = bullet?.[1] || numbered?.[1] || line;

        if (bullet || numbered) {
          return (
            <div
              key={content + "-" + index}
              className='flex items-start gap-2 text-sm leading-6 text-[var(--color-text)]'
            >
              <span
                className='mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[var(--color-primary)]'
                aria-hidden='true'
              />
              <span>{content}</span>
            </div>
          );
        }

        return (
          <p
            key={content + "-" + index}
            className='text-sm leading-6 text-[var(--color-text)]'
          >
            {content}
          </p>
        );
      })}
    </div>
  );
}

export default function CandidateAskAi({
  candidateId,
  candidateName,
  resetKey,
}: CandidateAskAiProps) {
  const headingId = useId();
  const questionId = useId();
  const questionHelpId = useId();
  const resultId = useId();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    requestVersionRef.current += 1;
    setQuestion("");
    setResult(null);
    setErrorMessage(null);
    setLoading(false);
    return () => {
      requestVersionRef.current += 1;
    };
  }, [candidateId, resetKey]);

  const askAi = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.post<AskResponse>(
        "/api/candidates/" + candidateId + "/ask",
        { question: trimmed },
      );
      if (requestVersionRef.current !== requestVersion) return;
      setResult(response.data);
      setQuestion(trimmed);
    } catch (error) {
      if (requestVersionRef.current !== requestVersion) return;
      const message = isApiError(error)
        ? error.response?.data?.error || "Không thể hỏi AI về CV"
        : "Không thể hỏi AI về CV";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setLoading(false);
      }
    }
  };

  return (
    <section
      className='sahara-card p-4 sm:p-6'
      aria-labelledby={headingId}
      aria-busy={loading}
    >
      <div className='mb-5 flex items-center gap-3'>
        <div className='rounded-lg bg-[var(--color-surface-strong)] p-2 text-[var(--color-primary)]'>
          <Bot size={20} aria-hidden='true' />
        </div>
        <div className='min-w-0'>
          <h3 id={headingId} className='text-lg font-black text-[var(--color-text)]'>
            Hỏi AI về CV
          </h3>
          <p className='truncate text-sm text-[var(--color-text-muted)]'>
            {candidateName}
          </p>
        </div>
      </div>

      <fieldset className='mb-4'>
        <legend className='mb-2 text-sm font-bold text-[var(--color-text)]'>
          Gợi ý câu hỏi
        </legend>
        <div className='flex flex-wrap gap-2'>
          {suggestedQuestions.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => void askAi(item)}
              disabled={loading}
              className='inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-left text-xs font-bold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60'
            >
              <Sparkles
                size={14}
                className='shrink-0 text-[var(--color-primary)]'
                aria-hidden='true'
              />
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <form
        className='mb-5'
        onSubmit={(event) => {
          event.preventDefault();
          void askAi();
        }}
      >
        <label
          htmlFor={questionId}
          className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
        >
          Câu hỏi về CV
        </label>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <textarea
            id={questionId}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder='Hỏi về kinh nghiệm, kỹ năng hoặc điểm mạnh trong CV...'
            rows={3}
            maxLength={500}
            aria-describedby={questionHelpId}
            aria-invalid={Boolean(errorMessage)}
            className='sahara-input min-h-28 flex-1 resize-y px-4 py-3 text-base sm:text-sm'
          />
          <button
            type='submit'
            disabled={loading || !question.trim()}
            className='sahara-button shrink-0 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? (
              <Loader2
                size={18}
                className='animate-spin motion-reduce:animate-none'
                aria-hidden='true'
              />
            ) : (
              <Send size={18} aria-hidden='true' />
            )}
            {loading ? "Đang hỏi" : "Hỏi AI"}
          </button>
        </div>
        <p
          id={questionHelpId}
          className='mt-1.5 text-xs text-[var(--color-text-muted)]'
        >
          Nhấn Enter để gửi, Shift + Enter để xuống dòng.
        </p>
      </form>

      {errorMessage && (
        <div
          className='mb-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] p-3 text-sm font-semibold text-[var(--color-danger)]'
          role='alert'
        >
          {errorMessage}
        </div>
      )}

      <div id={resultId} aria-live='polite'>
        {result ? (
          <div className='space-y-4'>
            {result.retrievalWarning && (
              <div
                className='rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]'
                role='status'
              >
                {result.retrievalWarning}
              </div>
            )}
            <div className='space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4'>
              {parseAnswerSections(result.answer).map((section, index) => (
                <section
                  key={section.title + "-" + index}
                  className='border-l-2 border-[var(--color-primary)] pl-3'
                >
                  <h4 className='mb-1.5 text-xs font-black uppercase text-[var(--color-primary)]'>
                    {section.title === "Điểm phù hợp"
                      ? "Điểm phù hợp tổng thể"
                      : section.title}
                  </h4>
                  {section.title === "Điểm phù hợp" ? (
                    <p className='text-2xl font-black text-[var(--color-primary)]'>
                      {section.body}
                    </p>
                  ) : (
                    <AnswerBody body={section.body} />
                  )}
                </section>
              ))}
            </div>
          </div>
        ) : (
          <p className='rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5 text-center text-sm text-[var(--color-text-muted)]'>
            Upload CV PDF/DOCX/PNG/JPG trước, đợi index AI thành công,
            sau đó hỏi về kinh nghiệm hoặc độ phù hợp với công việc.
          </p>
        )}
      </div>
    </section>
  );
}
