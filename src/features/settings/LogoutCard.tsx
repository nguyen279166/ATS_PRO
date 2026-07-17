import { LogOut } from "lucide-react";

type LogoutCardProps = {
  onLogout: () => void;
};

export default function LogoutCard({ onLogout }: LogoutCardProps) {
  return (
    <section className='sahara-card p-5 sm:p-6' aria-labelledby='logout-title'>
      <h2 id='logout-title' className='text-lg font-black text-[var(--sahara-text)]'>
        Phiên đăng nhập
      </h2>
      <p className='mt-1 text-sm leading-6 text-[var(--sahara-muted)]'>
        Đăng xuất khỏi tài khoản trên thiết bị này.
      </p>
      <button
        type='button'
        onClick={onLogout}
        className='mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-danger)] bg-[var(--color-surface)] px-4 font-bold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-surface-subtle)]'
      >
        <LogOut aria-hidden='true' size={18} />
        Đăng xuất khỏi hệ thống
      </button>
    </section>
  );
}
