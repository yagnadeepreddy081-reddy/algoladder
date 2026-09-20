/**
 * Password feedback shared by the server action and the live meter on the
 * sign-up form. Kept in its own module with no Node imports so it can be
 * bundled into the client without dragging `node:crypto` along.
 */

export interface PasswordCheck {
  ok: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  problems: string[];
}

const COMMON = ['password', '12345678', 'qwerty', 'letmein', 'algoladder', 'iloveyou', 'admin123'];

export function checkPasswordStrength(password: string): PasswordCheck {
  const problems: string[] = [];
  if (password.length < 8) problems.push('Use at least 8 characters');
  if (!/[a-z]/.test(password)) problems.push('Add a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('Add an uppercase letter');
  if (!/[0-9]/.test(password)) problems.push('Add a number');
  if (COMMON.some((c) => password.toLowerCase().includes(c))) problems.push('Avoid common words');

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;

  return {
    ok: problems.length === 0,
    score: Math.min(4, score) as 0 | 1 | 2 | 3 | 4,
    problems,
  };
}
