/** URL parsers normalize backslashes to slashes; reject them before redirecting. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/dashboard';
  try {
    const base = 'https://algoladder.invalid';
    const target = new URL(value, base);
    return target.origin === base ? `${target.pathname}${target.search}${target.hash}` : '/dashboard';
  } catch { return '/dashboard'; }
}
