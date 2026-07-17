import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Workflow,
} from "lucide-react";
import type { CandidateStatus } from "../../types";
import { KANBAN_COLUMNS } from "./constants";

type KanbanStagePickerProps = {
  candidateId: string;
  candidateName: string;
  value: CandidateStatus;
  isUpdating: boolean;
  onChange: (status: CandidateStatus) => Promise<void>;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
  ready: boolean;
};

const MENU_GAP = 8;
const VIEWPORT_GUTTER = 8;
const MIN_MENU_WIDTH = 268;

export default function KanbanStagePicker({
  candidateId,
  candidateName,
  value,
  isUpdating,
  onChange,
}: KanbanStagePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    KANBAN_COLUMNS.findIndex((column) => column.status === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: MIN_MENU_WIDTH,
    placement: "bottom",
    ready: false,
  });

  const triggerId = `candidate-status-${candidateId}`;
  const listboxId = `${triggerId}-listbox`;
  const statusMessageId = `${triggerId}-message`;
  const selectedColumn = KANBAN_COLUMNS[selectedIndex];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const availableWidth = Math.max(0, window.innerWidth - VIEWPORT_GUTTER * 2);
    const width = Math.min(Math.max(rect.width, MIN_MENU_WIDTH), availableWidth);
    const menuHeight = menuRef.current?.offsetHeight ?? 272;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_GUTTER;
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_GUTTER;
    const placement =
      spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
    const idealTop =
      placement === "top" ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP;
    const top = Math.min(
      Math.max(VIEWPORT_GUTTER, idealTop),
      Math.max(VIEWPORT_GUTTER, window.innerHeight - menuHeight - VIEWPORT_GUTTER),
    );
    const left = Math.min(
      Math.max(VIEWPORT_GUTTER, rect.left),
      Math.max(VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER),
    );

    setMenuPosition({ top, left, width, placement, ready: true });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();
    const animationFrame = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    setMenuPosition((current) => ({ ...current, ready: false }));
    setIsOpen(true);
  };

  const selectStage = (status: CandidateStatus) => {
    setIsOpen(false);
    triggerRef.current?.focus();
    if (status !== value) void onChange(status);
  };

  const moveActiveOption = (direction: 1 | -1) => {
    setActiveIndex((current) =>
      (current + direction + KANBAN_COLUMNS.length) % KANBAN_COLUMNS.length,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu(selectedIndex);
      } else {
        moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }

    if ((event.key === "Home" || event.key === "End") && isOpen) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : KANBAN_COLUMNS.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) {
        selectStage(KANBAN_COLUMNS[activeIndex].status);
      } else {
        openMenu();
      }
    }
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      id={listboxId}
      role='listbox'
      aria-label={`Chuyển giai đoạn cho ${candidateName}`}
      className='kanban-stage-menu'
      data-placement={menuPosition.placement}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        width: menuPosition.width,
        visibility: menuPosition.ready ? "visible" : "hidden",
      }}
    >
      <div className='kanban-stage-menu-heading' aria-hidden='true'>
        <span>Chuyển giai đoạn</span>
        <span>↑↓ để chọn</span>
      </div>
      <div className='grid gap-1'>
        {KANBAN_COLUMNS.map((column, index) => {
          const isSelected = column.status === value;
          const isActive = index === activeIndex;
          const optionId = `${listboxId}-${column.status.toLowerCase()}`;

          return (
            <button
              key={column.status}
              id={optionId}
              type='button'
              role='option'
              tabIndex={-1}
              aria-selected={isSelected}
              className='kanban-stage-option'
              data-status={column.status}
              data-active={isActive}
              data-selected={isSelected}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectStage(column.status)}
            >
              <span className='kanban-stage-option-marker' aria-hidden='true'>
                <span />
              </span>
              <span className='min-w-0'>
                <span className='block text-[0.8rem] font-black leading-5 text-[var(--color-text)]'>
                  {column.label}
                </span>
                <span className='block truncate text-[0.67rem] font-semibold leading-4 text-[var(--color-text-muted)]'>
                  {column.description}
                </span>
              </span>
              <span className='flex h-6 w-6 items-center justify-center text-[var(--option-color)]'>
                {isSelected && <Check aria-hidden='true' size={16} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div
      className='flex min-w-0 flex-1 items-center gap-2.5'
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type='button'
        role='combobox'
        aria-label={`Giai đoạn: ${selectedColumn.label}. Chọn để thay đổi`}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen
            ? `${listboxId}-${KANBAN_COLUMNS[activeIndex].status.toLowerCase()}`
            : undefined
        }
        aria-describedby={isUpdating ? statusMessageId : undefined}
        disabled={isUpdating}
        draggable={false}
        className='kanban-stage-trigger'
        onDragStart={(event) => event.stopPropagation()}
        onBlur={() => setIsOpen(false)}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className='kanban-stage-trigger-icon' aria-hidden='true'>
          <Workflow size={15} strokeWidth={2.25} />
        </span>
        <span className='min-w-0 flex-1 truncate text-left text-[0.78rem] font-black'>
          {selectedColumn.label}
        </span>
        <ChevronDown
          aria-hidden='true'
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          size={15}
          strokeWidth={2.5}
        />
      </button>

      {isUpdating && (
        <span className='kanban-stage-saving' role='status'>
          <LoaderCircle aria-hidden='true' className='animate-spin' size={16} />
          <span id={statusMessageId} className='sr-only'>
            Đang lưu trạng thái...
          </span>
        </span>
      )}

      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
