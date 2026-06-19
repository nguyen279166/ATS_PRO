import { useEffect, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient, isApiError } from "../api/client";

type RagSource = {
  chunkIndex: number;
  content: string;
  score: number;
};

type AskResponse = {
  answer: string;
  sources: RagSource[];
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
  "Bằng chứng",
  "Điểm còn thiếu",
  "Gợi ý phỏng vấn",
  "Tóm tắt",
  "Kết luận",
];

function parseAnswerSections(answer: string) {
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of answer.split("\n")) {
    const trimmed = line.trim();
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
      current.body.push(line);
    } else if (trimmed) {
      current = { title: "Trả lời", body: [line] };
    }
  }

  if (current) {
    sections.push({
      title: current.title,
      body: current.body.join("\n").trim(),
    });
  }

  return sections.length > 0 ? sections : [{ title: "Trả lời", body: answer }];
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
          <div className="space-y-3 rounded-lg border border-[#d8c8b5] bg-[#fff7eb] p-4">
            {parseAnswerSections(result.answer).map((section) => (
              <section key={section.title} className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wide text-[#8a4518]">
                  {section.title}
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#3a302a]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {result.sources.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-black uppercase text-[#8a4518]">
                Nguồn trích từ CV
              </h4>
              <div className="space-y-2">
                {result.sources.map((source) => (
                  <details
                    key={source.chunkIndex}
                    className="rounded-lg border border-[#d8c8b5] bg-[#fffaf2] p-3"
                  >
                    <summary className="cursor-pointer text-xs font-bold text-[#7a4d26]">
                      Chunk {source.chunkIndex + 1} · độ khớp {Math.round(source.score * 100)}%
                    </summary>
                    <p className="mt-2 line-clamp-6 text-xs leading-5 text-[#7d6f62]">
                      {source.content}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#d8c8b5] bg-[#fff7eb]/70 p-5 text-center text-sm text-[#9a7655]">
          Upload CV PDF/DOCX/PNG/JPG trước, đợi index AI thành công, sau đó hỏi về kinh nghiệm hoặc độ phù hợp với job.
        </div>
      )}
    </div>
  );
}
