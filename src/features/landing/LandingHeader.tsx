import { Link } from "react-router-dom";
import BrandMark from "../../components/BrandMark";

export function LandingHeader() {
  return (
    <header>
      <nav
        className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5'
        aria-label='Điều hướng chính'
      >
        <Link
          to='/'
          className='flex min-h-11 min-w-0 items-center gap-2 sm:gap-3'
          aria-label='ATS PRO - Trang cơ hội nghề nghiệp'
        >
          <span className='brand-mark-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'>
            <BrandMark className='h-8 w-8' />
          </span>
          <span className='min-w-0'>
            <span className='block text-lg font-black sm:text-xl'>ATS PRO</span>
            <span className='hidden text-xs font-bold text-[var(--color-text-muted)] sm:block'>
              Hệ thống tuyển dụng
            </span>
          </span>
        </Link>

        <div className='flex shrink-0 items-center gap-1 sm:gap-3'>
          <Link
            to='/login'
            className='inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-[var(--color-text-muted)] transition-colors duration-150 hover:text-[var(--color-primary)] sm:px-3'
          >
            Đăng nhập
          </Link>
          <Link to='/register' className='sahara-button px-3 py-2 text-sm sm:px-4'>
            Đăng ký
          </Link>
        </div>
      </nav>
    </header>
  );
}
