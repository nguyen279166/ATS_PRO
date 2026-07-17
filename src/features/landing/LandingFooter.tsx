export function LandingFooter() {
  return (
    <footer className='border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm font-medium text-[var(--color-text-muted)] sm:px-8'>
      <p>
        &copy; 2026 ATS PRO. Xây dựng bởi{" "}
        <a
          className='font-black text-[var(--color-primary)] transition-colors duration-150 hover:text-[var(--color-primary-hover)]'
          href='https://web.facebook.com/chungnguyen.nguyen.9028'
        >
          Nguyễn Chung Nguyên
        </a>
        .
      </p>
    </footer>
  );
}
