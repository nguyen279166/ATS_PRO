import {
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import BrandMark from "../../components/BrandMark";

type AuthPageProps = {
  children: ReactNode;
  navLink: {
    to: string;
    label: string;
    icon?: ReactNode;
  };
};

export function AuthPage({ children, navLink }: AuthPageProps) {
  return (
    <main className='sahara-auth-shell min-h-screen px-4 py-5 sm:px-6'>
      <a className='skip-link' href='#auth-content'>
        Đi tới biểu mẫu
      </a>
      <nav
        aria-label='Điều hướng tài khoản'
        className='mx-auto flex min-h-11 w-full max-w-5xl items-center justify-between gap-4'
      >
        <Link
          to='/'
          aria-label='ATS PRO — về trang chủ'
          className='flex min-h-11 items-center gap-3 rounded-lg'
        >
          <span className='brand-mark-tile flex h-10 w-10 items-center justify-center rounded-xl'>
            <BrandMark className='h-7 w-7' />
          </span>
          <span className='text-xl font-black tracking-normal text-[var(--color-text)]'>
            ATS PRO
          </span>
        </Link>
        <Link
          to={navLink.to}
          className='flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]'
        >
          {navLink.icon}
          {navLink.label}
        </Link>
      </nav>

      <section
        id='auth-content'
        className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl scroll-mt-6 items-center justify-center py-8'
      >
        {children}
      </section>
    </main>
  );
}

type AuthHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

export function AuthHeading({
  eyebrow,
  title,
  description,
  icon,
}: AuthHeadingProps) {
  return (
    <header>
      {icon && (
        <span className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-surface-strong)] text-[var(--color-primary)]'>
          {icon}
        </span>
      )}
      <p className='mb-2 text-xs font-black uppercase tracking-wide text-[var(--color-primary)]'>
        {eyebrow}
      </p>
      <h1 className='text-3xl font-black tracking-normal'>{title}</h1>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
        {description}
      </p>
    </header>
  );
}

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  icon?: LucideIcon;
};

export function AuthField({
  id,
  label,
  error,
  icon: Icon,
  className = "",
  ...inputProps
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className='mb-1.5 block text-sm font-bold'>
        {label}
      </label>
      <div className='relative'>
        {Icon && (
          <Icon
            aria-hidden='true'
            size={17}
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]'
          />
        )}
        <input
          {...inputProps}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`sahara-input h-11 w-full text-sm ${Icon ? "px-10" : "px-3"} ${className}`}
        />
      </div>
      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className='mt-1 min-h-5 text-sm font-medium text-[var(--color-danger)]'
      >
        {error}
      </p>
    </div>
  );
}

type PasswordFieldProps = Omit<AuthFieldProps, "type" | "icon"> & {
  labelAction?: ReactNode;
};

export function PasswordField({
  id,
  label,
  error,
  labelAction,
  className = "",
  ...inputProps
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <div className='mb-1.5 flex items-center justify-between gap-3'>
        <label htmlFor={id} className='block text-sm font-bold'>
          {label}
        </label>
        {labelAction}
      </div>
      <div className='relative'>
        <input
          {...inputProps}
          id={id}
          type={isVisible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`sahara-input h-11 w-full px-3 pr-12 text-sm ${className}`}
        />
        <button
          type='button'
          aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className='sahara-icon-button absolute right-1 top-1/2 h-9 min-h-9 w-9 -translate-y-1/2'
        >
          {isVisible ? <EyeOff aria-hidden='true' size={17} /> : <Eye aria-hidden='true' size={17} />}
        </button>
      </div>
      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className='mt-1 min-h-5 text-sm font-medium text-[var(--color-danger)]'
      >
        {error}
      </p>
    </div>
  );
}
