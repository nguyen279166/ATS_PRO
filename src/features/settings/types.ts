export type SettingsProfile = {
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
};

export type PasswordField =
  | "currentPassword"
  | "newPassword"
  | "confirmPassword";

export type PasswordError = {
  field: PasswordField;
  message: string;
};

export type PasswordValues = Record<PasswordField, string>;
