import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function Dialog({
  labelledBy,
  onClose,
  children,
  className = "",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const panel = panelRef.current;
    document.body.style.overflow = "hidden";
    const preferredFocus = panel?.querySelector<HTMLElement>(
      "[data-dialog-autofocus]",
    );
    const firstFocusable = panel?.querySelector<HTMLElement>(focusableSelector);
    (preferredFocus ?? firstFocusable ?? panel)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      event.stopPropagation();

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel?.addEventListener("keydown", handleKeyDown);
    return () => {
      panel?.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <button
        type='button'
        className='absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]'
        onClick={onClose}
        tabIndex={-1}
        aria-hidden='true'
      />
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`sahara-card relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto shadow-[var(--shadow-raised)] focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
