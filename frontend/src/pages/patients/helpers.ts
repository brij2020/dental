// Small helpers kept independent for testability and reuse

export const is10Digits = (v: string) => /^\d{10}$/.test(v);

// Keep the old one for backward compatibility if needed elsewhere
export const is14Digits = (v: string) => /^\d{14}$/.test(v);

// defensive DOB age computation (safe for invalid/empty values)
export const computeAge = (iso: string | null) => {
  if (!iso) return '';
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return `${age}`;
};

// basic sanitizer for free-text inputs (trim + collapse spaces)
export const safeTrim = (s: string) => s.replace(/\s+/g, ' ').trim();

// Phone number validation (10 digits, ignoring formatting characters)
export const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v.replace(/[\s\-+()]/g, ''));