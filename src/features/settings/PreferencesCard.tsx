import type { LucideIcon } from "lucide-react";
import { Bell, Moon } from "lucide-react";

type SwitchSettingProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
};

function SwitchSetting({
  icon: Icon,
  title,
  description,
  checked,
  onToggle,
}: SwitchSettingProps) {
  return (
    <div className='flex items-center justify-between gap-4 py-2'>
      <div className='flex min-w-0 items-start gap-3'>
        <Icon
          aria-hidden='true'
          className='mt-0.5 shrink-0 text-[var(--sahara-primary)]'
          size={19}
        />
        <div>
          <p className='text-sm font-bold text-[var(--sahara-text)]'>{title}</p>
          <p className='mt-0.5 text-xs leading-5 text-[var(--sahara-muted)]'>
            {description}
          </p>
        </div>
      </div>

      <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-label={`${title}: ${checked ? "bật" : "tắt"}`}
        onClick={onToggle}
        className='flex h-11 w-12 shrink-0 items-center justify-center rounded-lg'
      >
        <span
          aria-hidden='true'
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
            checked
              ? "bg-[var(--sahara-primary)]"
              : "bg-[var(--color-border)]"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </div>
  );
}

type PreferencesCardProps = {
  emailNotifications: boolean;
  isDark: boolean;
  onToggleEmailNotifications: () => void;
  onToggleDarkMode: () => void;
};

export default function PreferencesCard({
  emailNotifications,
  isDark,
  onToggleEmailNotifications,
  onToggleDarkMode,
}: PreferencesCardProps) {
  return (
    <section className='sahara-card p-5 sm:p-6' aria-labelledby='preferences-title'>
      <h2 id='preferences-title' className='text-lg font-black text-[var(--sahara-text)]'>
        Tùy chỉnh hệ thống
      </h2>
      <div className='mt-3 divide-y divide-[var(--color-border)]'>
        <SwitchSetting
          icon={Bell}
          title='Thông báo email'
          description='Lưu lựa chọn nhận thông báo trên thiết bị này.'
          checked={emailNotifications}
          onToggle={onToggleEmailNotifications}
        />
        <SwitchSetting
          icon={Moon}
          title='Giao diện tối'
          description='Giảm độ sáng giao diện khi làm việc trong môi trường tối.'
          checked={isDark}
          onToggle={onToggleDarkMode}
        />
      </div>
    </section>
  );
}
