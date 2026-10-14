import 'server-only';

/** Resend REST transport: no SDK or new runtime dependency required. */
export async function sendResetEmail(email: string, resetUrl: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error('Configure RESEND_API_KEY and EMAIL_FROM to send reset emails.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], subject: 'Reset your AlgoLadder password',
      text: `Reset your password using this link, valid for one hour:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.` }),
  });
  if (!response.ok) throw new Error(`Reset email delivery failed (HTTP ${response.status}).`);
}
