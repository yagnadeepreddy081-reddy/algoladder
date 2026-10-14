import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendResetEmail } from '@/lib/auth/email';
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('password reset email transport', () => {
  it('fails clearly when sender configuration is missing', async () => {vi.stubEnv('RESEND_API_KEY','');await expect(sendResetEmail('a@example.test','https://example.test/reset')).rejects.toThrow('Configure');});
  it('sends a text email through the configured transport', async () => {vi.stubEnv('RESEND_API_KEY','test-key');vi.stubEnv('EMAIL_FROM','noreply@example.test');const fetcher=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetcher);await sendResetEmail('a@example.test','https://example.test/reset?token=test');expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails',expect.objectContaining({method:'POST'}));const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.to).toEqual(['a@example.test']);expect(body.text).toContain('https://example.test/reset?token=test');});
  it('propagates provider failures without logging reset credentials', async () => {vi.stubEnv('RESEND_API_KEY','test-key');vi.stubEnv('EMAIL_FROM','noreply@example.test');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:429})));await expect(sendResetEmail('a@example.test','https://example.test/reset')).rejects.toThrow('HTTP 429');});
});
