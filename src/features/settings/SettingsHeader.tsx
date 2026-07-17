import { Settings } from "lucide-react";

export default function SettingsHeader() {
  return (
    <header className='flex items-start gap-3'>
      <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] text-[var(--sahara-primary)]'>
        <Settings aria-hidden='true' size={22} />
      </div>
      <div>
        <h1
          id='settings-page-title'
          className='sahara-page-title text-2xl font-black sm:text-3xl'
          tabIndex={-1}
        >
          Cài đặt tài khoản
        </h1>
        <p className='mt-1 text-sm leading-6 text-[var(--sahara-muted)] sm:text-base'>
          Quản lý hồ sơ, bảo mật và tùy chọn làm việc của bạn
        </p>
      </div>
    </header>
  );
}
