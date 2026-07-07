export interface PasswordRules {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export type PasswordStrength = "weak" | "fair" | "strong" | "very-strong";

const DEFAULT_RULES: Required<PasswordRules> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
};

export function validatePassword(password: string, rules: PasswordRules = {}): PasswordValidationResult {
  const merged = { ...DEFAULT_RULES, ...rules };
  const errors: string[] = [];

  if (password.length < merged.minLength) errors.push(`Must be at least ${merged.minLength} characters`);
  if (merged.requireUppercase && !/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (merged.requireLowercase && !/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (merged.requireNumber && !/[0-9]/.test(password)) errors.push("Must contain a number");
  if (merged.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) errors.push("Must contain a special character");

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score <= 4) return "strong";
  return "very-strong";
}
