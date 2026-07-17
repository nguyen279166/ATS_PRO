import type { ChangeEvent } from "react";
import { Camera, LoaderCircle, RefreshCw, Shield } from "lucide-react";
import Avatar from "../../components/Avatar";
import { formatDate } from "../../utils/date";
import type { SettingsProfile } from "./types";

type ProfileCardProps = {
  profile: SettingsProfile | null;
  profileError: string | null;
  isUploading: boolean;
  uploadError: string | null;
  uploadStatus: string | null;
  onRetry: () => Promise<void>;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

const getRoleLabel = (role?: string) => {
  if (role === "admin") return "Quản trị viên";
  if (role === "hr") return "Nhân sự";
  return "Người dùng";
};

export default function ProfileCard({
  profile,
  profileError,
  isUploading,
  uploadError,
  uploadStatus,
  onRetry,
  onAvatarUpload,
}: ProfileCardProps) {
  return (
    <section
      className='sahara-card p-5 text-center sm:p-6'
      aria-labelledby='settings-profile-title'
    >
      <h2 id='settings-profile-title' className='sr-only'>
        Hồ sơ cá nhân
      </h2>

      <Avatar
        name={profile?.fullName}
        src={profile?.avatar}
        className='mx-auto h-24 w-24 text-3xl shadow-inner'
        imageClassName='border-4 border-[var(--color-surface-strong)]'
      />

      <div className='mt-4'>
        <h3 className='text-xl font-black text-[var(--sahara-text)]'>
          {profile?.fullName || "Chưa tải được hồ sơ"}
        </h3>
        <p className='mt-1 break-all text-sm font-medium text-[var(--sahara-muted)]'>
          {profile?.email || "Chưa có thông tin email"}
        </p>
        <span className='sahara-status sahara-status-interviewing mt-3 gap-1.5'>
          <Shield aria-hidden='true' size={14} />
          {getRoleLabel(profile?.role)}
        </span>
      </div>

      <div className='mt-5 border-t border-[var(--color-border)] pt-5'>
        <label
          htmlFor='settings-avatar-upload'
          className={`sahara-button-secondary w-full cursor-pointer px-4 ${
            isUploading ? "cursor-wait opacity-60" : ""
          }`}
          aria-disabled={isUploading}
        >
          {isUploading ? (
            <LoaderCircle
              aria-hidden='true'
              className='motion-safe:animate-spin'
              size={18}
            />
          ) : (
            <Camera aria-hidden='true' size={18} />
          )}
          {isUploading ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
          <input
            id='settings-avatar-upload'
            type='file'
            accept='image/*'
            className='sr-only'
            onChange={(event) => void onAvatarUpload(event)}
            disabled={isUploading}
            aria-describedby='settings-avatar-help settings-avatar-feedback'
          />
        </label>
        <p
          id='settings-avatar-help'
          className='mt-2 text-xs leading-5 text-[var(--sahara-muted)]'
        >
          Chọn tệp ảnh có dung lượng dưới 5MB.
        </p>
        <div id='settings-avatar-feedback' aria-live='polite'>
          {uploadError && (
            <p className='mt-2 text-sm font-semibold text-[var(--color-danger)]' role='alert'>
              {uploadError}
            </p>
          )}
          {uploadStatus && !uploadError && (
            <p className='mt-2 text-sm font-semibold text-[var(--sahara-secondary)]' role='status'>
              {uploadStatus}
            </p>
          )}
        </div>
      </div>

      <div className='mt-5 border-t border-[var(--color-border)] pt-5'>
        <p className='text-xs font-medium text-[var(--sahara-muted)]'>
          Tham gia hệ thống từ
        </p>
        <p className='mt-1 text-sm font-bold tabular-nums text-[var(--sahara-text)]'>
          {formatDate(profile?.createdAt)}
        </p>
      </div>

      {profileError && (
        <div
          className='mt-5 rounded-lg border border-[var(--color-danger)] p-3 text-left'
          role='alert'
        >
          <p className='text-sm leading-6 text-[var(--color-danger)]'>
            {profileError}
          </p>
          <button
            type='button'
            onClick={() => void onRetry()}
            className='sahara-button-secondary mt-3 w-full px-3 text-sm'
          >
            <RefreshCw aria-hidden='true' size={17} />
            Thử tải lại
          </button>
        </div>
      )}
    </section>
  );
}
