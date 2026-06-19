import { useEffect, useState } from "react";
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

type Props = {
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

function parseAnswerSections(answer: string) {
  let normalizedAnswer = answer;
  for (const label of answerSectionLabels) {
    normalizedAnswer = normalizedAnswer
      .replaceAll(`**${label}:**`, `\n${label}:`)
      .replaceAll(`**${label}**:`, `\n${label}:`)
      .replaceAll(`### ${label}`, `\n${label}:`)
      .replaceAll(`## ${label}`, `\n${label}:`);
  }

  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of normalizedAnswer.split("\n")) {
    const trimmed = cleanMarkdown(line).replace(/^[-*•]\s*/, "");
    const matchedLabel = answerSectionLabels.find((label) =>
      trimmed.toLowerCase().startsWith(`${label.toLowerCase()}:`),
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

function cleanMarkdown(value: string) {
  return value
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function AnswerBody({ body }: { body: string }) {
  const lines = body
    .split("\n")
    .map((line) => cleanMarkdown(line))
    .filter(Boolean);

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const bullet = line.match(/^[-*•]\s+(.+)/);
        const numbered = line.match(/^\d+[.)]\s+(.+)/);
        const content = bullet?.[1] || numbered?.[1] || line;

        if (bullet || numbered) {
          return (
            <div
              key={`${content}-${index}`}
              className="flex items-start gap-2 text-sm leading-5 text-[#3a302a]"
            >
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#c2652a]" />
              <span>{content}</span>
            </div>
          );
        }

        return (
          <p key={`${content}-${index}`} className="text-sm leading-5 text-[#3a302a]">
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
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuestion("");
    setResult(null);
    setErrorMessage(null);
  }, [candidateId, resetKey]);

  const askAi = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post<AskResponse>(
        `/api/candidates/${candidateId}/ask`,
        { question: trimmed },
      );
      setResult(res.data);
      setQuestion(trimmed);
    } catch (error) {
      const message = isApiError(error)
        ? error.response?.data?.error || "Không thể hỏi AI về CV"
        : "Không thể hỏi AI về CV";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sahara-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-[#f4dfbd] p-2 text-[#8a4518]">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#3a302a]">Hỏi AI về CV</h3>
          <p className="text-sm text-[#7d6f62]">{candidateName}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => askAi(item)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8c8b5] bg-[#fff7eb] px-3 py-2 text-xs font-bold text-[#7a4d26] transition-colors hover:border-[#c2652a] hover:text-[#8a4518] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={13} />
            {item}
          </button>
        ))}
      </div>

      <form
        className="mb-5 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          askAi();
        }}
      >
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              askAi();
            }
          }}
          placeholder="Hỏi về kinh nghiệm, kỹ năng hoặc điểm mạnh trong CV..."
          rows={3}
          className="sahara-input flex-1 resize-none px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="sahara-button self-end px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-[#d7a184] bg-[#fff0e8] p-3 text-sm font-semibold text-[#8c3c3c]">
          {errorMessage}
        </div>
      )}

      {result ? (
        <div className="space-y-4">
          {result.retrievalWarning && (
            <div className="rounded-lg border border-[#d9b27c] bg-[#fff4df] px-3 py-2 text-xs font-semibold text-[#7a4d26]">
              {result.retrievalWarning}
            </div>
          )}
          <div className="space-y-4 rounded-lg border border-[#d8c8b5] bg-[#fff7eb] p-4">
            {parseAnswerSections(result.answer).map((section, index) => (
              <section
                key={`${section.title}-${index}`}
                className="border-l-2 border-[#d4a36f] pl-3"
              >
                <h4 className="mb-1.5 text-xs font-black uppercase text-[#8a4518]">
                  {section.title === "Điểm phù hợp"
                    ? "Điểm phù hợp tổng thể"
                    : section.title}
                </h4>
                {section.title === "Điểm phù hợp" ? (
                  <p className="text-2xl font-black text-[#c2652a]">
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
        <div className="rounded-lg border border-dashed border-[#d8c8b5] bg-[#fff7eb]/70 p-5 text-center text-sm text-[#9a7655]">
          Upload CV PDF/DOCX/PNG/JPG trước, đợi index AI thành công, sau đó hỏi về kinh nghiệm hoặc độ phù hợp với job.
        </div>
      )}
    </div>
  );
}
