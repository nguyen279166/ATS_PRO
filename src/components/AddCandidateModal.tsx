import { useId, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { CandidateStatus } from "../types";
import Dialog from "./ui/Dialog";

interface AddCandidateModalProps {
  jobId: string;
  onClose: () => void;
  onAdd: (candidate: {
    name: string;
    email: string;
    status: CandidateStatus;
  }) => void;
}

export default function AddCandidateModal({
  onClose,
  onAdd,
}: AddCandidateModalProps) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const statusId = useId();
  const errorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CandidateStatus>("Applied");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setFormError("Vui lòng nhập đầy đủ họ tên và email ứng viên.");
      if (!name.trim()) {
        nameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
      return;
    }

    setFormError(null);
    onAdd({ name, email, status });
    setName("");
    setEmail("");
    onClose();
  };

  return (
    <Dialog labelledBy={titleId} onClose={onClose} className='max-w-md'>
      <div className='p-4 text-[var(--color-text)] sm:p-6'>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div>
            <h2 id={titleId} className='text-xl font-black'>
              Thêm ứng viên mới
            </h2>
            <p className='mt-1 text-sm text-[var(--color-text-muted)]'>
              Nhập thông tin cơ bản để thêm ứng viên vào pipeline.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='sahara-icon-button -mr-2 -mt-2 shrink-0'
            aria-label='Đóng hộp thoại thêm ứng viên'
          >
            <X size={20} aria-hidden='true' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label
              htmlFor={nameId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Họ và tên
            </label>
            <input
              ref={nameRef}
              id={nameId}
              data-dialog-autofocus
              type='text'
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (formError) setFormError(null);
              }}
              placeholder='Nhập họ tên ứng viên...'
              autoComplete='name'
              aria-invalid={Boolean(formError && !name.trim())}
              aria-describedby={formError ? errorId : undefined}
              className='sahara-input w-full px-4 py-2.5 text-base'
            />
          </div>

          <div>
            <label
              htmlFor={emailId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Email
            </label>
            <input
              ref={emailRef}
              id={emailId}
              type='email'
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (formError) setFormError(null);
              }}
              placeholder='email@example.com'
              autoComplete='email'
              aria-invalid={Boolean(formError && !email.trim())}
              aria-describedby={formError ? errorId : undefined}
              className='sahara-input w-full px-4 py-2.5 text-base'
            />
          </div>

          <div>
            <label
              htmlFor={statusId}
              className='mb-1.5 block text-sm font-bold text-[var(--color-text)]'
            >
              Trạng thái ban đầu
            </label>
            <select
              id={statusId}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CandidateStatus)
              }
              className='sahara-input w-full px-4 py-2.5 text-base'
            >
              <option value='Applied'>Applied</option>
              <option value='Interviewing'>Interviewing</option>
              <option value='Hired'>Hired</option>
              <option value='Rejected'>Rejected</option>
            </select>
          </div>

          {formError && (
            <p
              id={errorId}
              className='rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface-subtle)] p-3 text-sm font-semibold text-[var(--color-danger)]'
              role='alert'
            >
              {formError}
            </p>
          )}

          <button type='submit' className='sahara-button w-full px-4 py-3'>
            Thêm ứng viên
          </button>
        </form>
      </div>
    </Dialog>
  );
}
