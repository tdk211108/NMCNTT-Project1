import 'server-only';

import { DEFAULT_EMAIL_FROM } from '@/shared/constants';
import { AppError } from '../http/errors';

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FETCH_TIMEOUT_MS = 10_000;

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type EmailSender = (payload: SendEmailPayload) => Promise<{ id: string }>;

export function resolveEmailFrom(): string {
  return (process.env.EMAIL_FROM ?? '').trim() || DEFAULT_EMAIL_FROM;
}

/**
 * Sends a transactional email via Resend HTTPS API (`coreraster.me`).
 * Falls back to console logging outside production when `RESEND_API_KEY` is unset.
 */
export async function sendEmail(
  payload: SendEmailPayload,
  fetchFn: typeof fetch = fetch,
): Promise<{ id: string }> {
  const apiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const from = resolveEmailFrom();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] RESEND_API_KEY is missing in production.');
      throw new AppError('EMAIL_DELIVERY_FAILED');
    }
    console.info('[email/dev]', {
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return { id: 'dev-console' };
  }

  let response: Response;
  try {
    response = await fetchFn(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
      signal: AbortSignal.timeout(EMAIL_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('[email/resend] request failed:', error);
    throw new AppError('EMAIL_DELIVERY_FAILED');
  }

  if (!response.ok) {
    const errorSnippet = await response.text().catch(() => '');
    console.error('[email/resend] non-2xx response:', response.status, errorSnippet.slice(0, 300));
    throw new AppError('EMAIL_DELIVERY_FAILED');
  }

  const json = (await response.json().catch(() => ({}))) as { id?: unknown };
  return { id: typeof json.id === 'string' && json.id ? json.id : 'sent' };
}
