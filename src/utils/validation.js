// Shared validation rules for the app and mirrored on the server side
// (server/server.js). Keep both in sync.

export const RWANDA_CODE = '+250';
export const RWANDA_FLAG = '\u{1F1F0}\u{1F1F7}';

// Rwandan mobile numbers are 10 digits starting with 07, e.g. 0788 123 456.
// We store them internationally as +250 788 123 456.
export const PHONE_LENGTH = 10;

export function sanitizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, PHONE_LENGTH);
}

export function isValidRwandanPhone(value) {
  const digits = sanitizePhoneDigits(value);
  if (digits.length !== PHONE_LENGTH) return false;
  // Mobile prefixes in Rwanda are 072, 073, 078 and 079.
  return /^07[2389]/.test(digits);
}

// 0788 123 456 -> +250 788 123 456
export function formatRwandanPhone(value) {
  const digits = sanitizePhoneDigits(value);
  if (digits.length !== PHONE_LENGTH) return '';
  return `${RWANDA_CODE} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

// Strong password: length plus all four character classes, and no obvious
// runs or repeats. Enough to make a weak password impractical without
// demanding a password manager's worth of entropy.
export const PASSWORD_MIN_LENGTH = 10;

export function getPasswordRules(value) {
  const pw = String(value || '');
  return [
    { key: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: pw.length >= PASSWORD_MIN_LENGTH },
    { key: 'lower', label: 'One lowercase letter', ok: /[a-z]/.test(pw) },
    { key: 'upper', label: 'One uppercase letter', ok: /[A-Z]/.test(pw) },
    { key: 'number', label: 'One number', ok: /[0-9]/.test(pw) },
    { key: 'symbol', label: 'One symbol (!@#$...)', ok: /[^A-Za-z0-9]/.test(pw) },
    { key: 'notSequence', label: 'No runs like "abc" or "123"', ok: pw.length === 0 || !hasRun(pw) },
    { key: 'notRepeated', label: 'Not the same character repeated', ok: pw.length === 0 || !hasRepeat(pw) },
  ];
}

export function getPasswordScore(value) {
  return getPasswordRules(value).filter((rule) => rule.ok).length;
}

export function isStrongPassword(value) {
  return getPasswordRules(value).every((rule) => rule.ok);
}

// "abc", "1234", "qwerty" style ascending or descending runs of 3+.
function hasRun(pw) {
  const lower = pw.toLowerCase();
  for (let i = 0; i + 2 < lower.length; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) return true;
    if (a - b === 1 && b - c === 1) return true;
  }
  return false;
}

// "aaaaaaaa", "111111" - 4 or more of the same character in a row.
function hasRepeat(pw) {
  return /(.)\1{3,}/.test(pw);
}