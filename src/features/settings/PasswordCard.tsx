import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Lock } from "lucide-react";
import type {
  PasswordError,
  PasswordField,
  PasswordValues,
} from "./types";

type PasswordCardProps = {
  values: PasswordValues;
  error: PasswordError | null;
  status: string | null;
  isSubmitting: boolean;
  onValueChange: (field: PasswordField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function PasswordCard({
  values,
  error,
  status,
  isSubmitting,
  onValueChange,
  onSubmit,
}: PasswordCardProps) {
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!error) return;
    const fieldRefs = {
      currentPassword: currentPasswordRef,
      newPassword: newPasswordRef,
      confirmPassword: confirmPasswordRef,
    };
    fieldRefs[error.field].current?.focus();
  }, [error]);

  const fieldError = (field: PasswordField) =>
    error?.field === field ? error.message : null;

  return (
    <section
      className='sahara-card p-5 sm:p-6 lg:p-8'
      aria-labelledby='password-settings-title'
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] text-[var(--sahara-primary)]'>
          <Lock aria-hidden='true' size={22} />
        </div>
        <div>
          <h2
            id='password-settings-title'
            className='text-xl font-black text-[var(--sahara-text)]'
          >
            Đổi mật khẩu
          </h2>
          <p className='mt-1 text-sm leading-6 text-[var(--sahara-muted)]'>
            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className='mt-6 space-y-5'
        aria-busy={isSubmitting}
      >
        <div>
          <label
            className='mb-2 block text-sm font-bold text-[var(--sahara-text)]'
            htmlFor='settings-current-password'
          >
            Mật khẩu hiện tại
          </label>
          <input
            ref={currentPasswordRef}
            id='settings-current-password'
            type='password'
            required
            autoComplete='current-password'
            value={values.currentPassword}
            onChange={(event) =>
              onValueChange("currentPassword", event.target.value)
            }
            className='sahara-input w-full px-4 text-base sm:text-sm'
            aria-invalid={Boolean(fieldError("currentPassword"))}
            aria-describedby={
              fieldError("currentPassword")
                ? "settings-current-password-error"
                : undefined
            }
            disabled={isSubmitting}
          />
          {fieldError("currentPassword") && (
            <p
              id='settings-current-password-error'
              className='mt-2 text-sm font-semibold text-[var(--color-danger)]'
              role='alert'
            >
              {fieldError("currentPassword")}
            </p>
          )}
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
          <div>
            <label
              className='mb-2 block text-sm font-bold text-[var(--sahara-text)]'
              htmlFor='settings-new-password'
            >
              Mật khẩu mới
            </label>
            <input
              ref={newPasswordRef}
              id='settings-new-password'
              type='password'
              required
              autoComplete='new-password'
              value={values.newPassword}
              onChange={(event) =>
                onValueChange("newPassword", event.target.value)
              }
              className='sahara-input w-full px-4 text-base sm:text-sm'
              aria-invalid={Boolean(fieldError("newPassword"))}
              aria-describedby={`settings-new-password-help${
                fieldError("newPassword")
                  ? " settings-new-password-error"
                  : ""
              }`}
              disabled={isSubmitting}
            />
            <p
              id='settings-new-password-help'
              className='mt-2 text-xs leading-5 text-[var(--sahara-muted)]'
            >
              Sử dụng ít nhất 8 ký tự.
            </p>
            {fieldError("newPassword") && (
              <p
                id='settings-new-password-error'
                className='mt-2 text-sm font-semibold text-[var(--color-danger)]'
                role='alert'
              >
                {fieldError("newPassword")}
              </p>
            )}
          </div>

          <div>
            <label
              className='mb-2 block text-sm font-bold text-[var(--sahara-text)]'
              htmlFor='settings-confirm-password'
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              ref={confirmPasswordRef}
              id='settings-confirm-password'
              type='password'
              required
              autoComplete='new-password'
              value={values.confirmPassword}
              onChange={(event) =>
                onValueChange("confirmPassword", event.target.value)
              }
              className='sahara-input w-full px-4 text-base sm:text-sm'
              aria-invalid={Boolean(fieldError("confirmPassword"))}
              aria-describedby={
                fieldError("confirmPassword")
                  ? "settings-confirm-password-error"
                  : undefined
              }
              disabled={isSubmitting}
            />
            {fieldError("confirmPassword") && (
              <p
                id='settings-confirm-password-error'
                className='mt-2 text-sm font-semibold text-[var(--color-danger)]'
                role='alert'
              >
                {fieldError("confirmPassword")}
              </p>
            )}
          </div>
        </div>

        <div aria-live='polite'>
          {status && !error && (
            <p
              className='rounded-lg border border-[var(--sahara-secondary)] p-3 text-sm font-semibold text-[var(--sahara-secondary)]'
              role='status'
            >
              {status}
            </p>
          )}
        </div>

        <div className='flex justify-stretch pt-2 sm:justify-end'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='sahara-button w-full px-6 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isSubmitting ? "Đang xử lý..." : "Lưu mật khẩu"}
          </button>
        </div>
      </form>
    </section>
  );
}
