export default function SettingsLoading() {
  return (
    <div className='space-y-6' role='status' aria-live='polite'>
      <p className='text-sm font-bold text-[var(--sahara-muted)]'>
        Đang tải cài đặt tài khoản...
      </p>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-1'>
          <div className='sahara-card h-80 p-6 motion-safe:animate-pulse' aria-hidden='true'>
            <div className='mx-auto h-24 w-24 rounded-full bg-[var(--color-surface-strong)]' />
            <div className='mx-auto mt-5 h-5 w-2/3 rounded bg-[var(--color-surface-strong)]' />
            <div className='mx-auto mt-3 h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]' />
          </div>
        </div>
        <div className='sahara-card h-96 p-6 motion-safe:animate-pulse lg:col-span-2' aria-hidden='true'>
          <div className='h-6 w-1/3 rounded bg-[var(--color-surface-strong)]' />
          <div className='mt-8 h-11 rounded bg-[var(--color-surface-subtle)]' />
          <div className='mt-5 grid grid-cols-1 gap-5 md:grid-cols-2'>
            <div className='h-11 rounded bg-[var(--color-surface-subtle)]' />
            <div className='h-11 rounded bg-[var(--color-surface-subtle)]' />
          </div>
        </div>
      </div>
    </div>
  );
}
