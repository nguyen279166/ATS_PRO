import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { CalendarClock, FileText, Sparkles, StickyNote, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import CandidateAskAi from "../../components/CandidateAskAi";
import CandidateCV from "../../components/CandidateCV";
import CandidateInterviews from "../../components/CandidateInterviews";
import CandidateNotes from "../../components/CandidateNotes";
import type { Candidate } from "../../types";
import { CANDIDATE_PANEL_TABS } from "./constants";
import type { CandidatePanelTab } from "./types";

type CandidateDrawerProps = {
  candidate: Candidate;
  activeTab: CandidatePanelTab;
  onTabChange: (tab: CandidatePanelTab) => void;
  onClose: () => void;
  onCandidateChange: (
    candidateId: string,
    updates: Partial<Candidate>,
  ) => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const TAB_ICONS = {
  notes: StickyNote,
  interviews: CalendarClock,
  cv: FileText,
  ai: Sparkles,
} as const;

export default function CandidateDrawer({
  candidate,
  activeTab,
  onTabChange,
  onClose,
  onCandidateChange,
}: CandidateDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.closest("[hidden]") === null);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % CANDIDATE_PANEL_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + CANDIDATE_PANEL_TABS.length) %
        CANDIDATE_PANEL_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CANDIDATE_PANEL_TABS.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = CANDIDATE_PANEL_TABS[nextIndex];
    onTabChange(nextTab.key);
    tabRefs.current[nextIndex]?.focus();
  };

  const titleId = `candidate-drawer-title-${candidate.id}`;

  return (
    <div className='fixed inset-0 z-50' role='presentation'>
      <button
        type='button'
        className='absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        aria-label={`Đóng chi tiết ứng viên ${candidate.name}`}
      />

      <div
        ref={panelRef}
        className='relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[var(--color-surface)] text-[var(--sahara-text)] shadow-[0_0_70px_rgba(0,0,0,0.34)]'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <div className='flex shrink-0 items-start justify-between gap-3 bg-[#17181b] p-5 text-white sm:p-6'>
          <div className='flex min-w-0 items-center gap-4'>
            <Avatar
              name={candidate.name}
              src={candidate.avatar}
              className='h-14 w-14 text-base ring-2 ring-white/15'
              imageClassName='ring-2 ring-white/15'
            />
            <div className='min-w-0'>
              <span className='mb-1.5 inline-flex rounded-full bg-[#ffb55f]/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#ffbf77]'>
                Hồ sơ ứng viên
              </span>
              <h2 id={titleId} className='truncate text-xl font-black tracking-[-0.02em]'>
                {candidate.name}
              </h2>
              <p className='mt-1 break-all text-xs font-semibold text-white/55'>
                {candidate.email}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type='button'
            onClick={onClose}
            className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/10 hover:text-white'
            aria-label='Đóng bảng chi tiết ứng viên'
          >
            <X aria-hidden='true' size={20} />
          </button>
        </div>

        <div
          className='grid shrink-0 grid-cols-4 gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-2.5'
          role='tablist'
          aria-label={`Thông tin chi tiết của ${candidate.name}`}
        >
          {CANDIDATE_PANEL_TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;
            const TabIcon = TAB_ICONS[tab.key];
            const tabId = `candidate-tab-${candidate.id}-${tab.key}`;
            const panelId = `candidate-panel-${candidate.id}-${tab.key}`;
            return (
              <button
                key={tab.key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId}
                type='button'
                role='tab'
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black transition-[background-color,color,box-shadow] sm:flex-row sm:text-xs ${
                  isActive
                    ? "bg-[var(--color-text)] text-[var(--color-surface)] shadow-sm"
                    : "text-[var(--sahara-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--sahara-text)]"
                }`}
              >
                <TabIcon aria-hidden='true' size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className='flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--color-surface-subtle)_45%,var(--color-surface))] p-4 sm:p-6'>
          {CANDIDATE_PANEL_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const tabId = `candidate-tab-${candidate.id}-${tab.key}`;
            const panelId = `candidate-panel-${candidate.id}-${tab.key}`;
            return (
              <div
                key={tab.key}
                id={panelId}
                role='tabpanel'
                aria-labelledby={tabId}
                hidden={!isActive}
                tabIndex={0}
              >
                {tab.key === "notes" && (
                  <CandidateNotes
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                  />
                )}
                {tab.key === "interviews" && (
                  <CandidateInterviews candidateId={candidate.id} />
                )}
                {tab.key === "cv" && (
                  <CandidateCV
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    initialCvUrl={candidate.cvUrl}
                    initialCvFileName={candidate.cvFileName}
                    onCvChange={(updates) =>
                      onCandidateChange(candidate.id, updates)
                    }
                  />
                )}
                {tab.key === "ai" && (
                  <CandidateAskAi
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    resetKey={`${candidate.cvUrl || ""}:${candidate.cvFileName || ""}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
