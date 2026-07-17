import { useEffect, useRef } from "react";

interface CandidateSelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}

export function CandidateSelectionCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: CandidateSelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className='inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg'
      onClick={(event) => event.stopPropagation()}
    >
      <input
        ref={inputRef}
        type='checkbox'
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className='h-5 w-5 cursor-pointer accent-[var(--color-primary)]'
      />
    </label>
  );
}
