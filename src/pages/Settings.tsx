import LogoutCard from "../features/settings/LogoutCard";
import PasswordCard from "../features/settings/PasswordCard";
import PreferencesCard from "../features/settings/PreferencesCard";
import ProfileCard from "../features/settings/ProfileCard";
import SettingsHeader from "../features/settings/SettingsHeader";
import SettingsLoading from "../features/settings/SettingsLoading";
import { useSettings } from "../features/settings/useSettings";

export default function Settings() {
  const settings = useSettings();

  if (settings.loading) {
    return <SettingsLoading />;
  }

  return (
    <div
      className='mx-auto max-w-6xl space-y-6'
      aria-labelledby='settings-page-title'
    >
      <SettingsHeader />

      <div className='grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]'>
        <div className='space-y-6'>
          <ProfileCard
            profile={settings.profile}
            profileError={settings.profileError}
            isUploading={settings.isUploading}
            uploadError={settings.uploadError}
            uploadStatus={settings.uploadStatus}
            onRetry={settings.loadProfile}
            onAvatarUpload={settings.handleAvatarUpload}
          />
          <PreferencesCard
            emailNotifications={settings.emailNotifications}
            isDark={settings.isDark}
            onToggleEmailNotifications={settings.toggleEmailNotifications}
            onToggleDarkMode={settings.toggleDarkMode}
          />
          <LogoutCard onLogout={settings.logout} />
        </div>

        <PasswordCard
          values={settings.passwordValues}
          error={settings.passwordError}
          status={settings.passwordStatus}
          isSubmitting={settings.isChangingPassword}
          onValueChange={settings.updatePasswordValue}
          onSubmit={settings.handleChangePassword}
        />
      </div>
    </div>
  );
}
