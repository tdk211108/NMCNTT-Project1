import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveEmailFrom, sendEmail } from '@/server/email/resend';
import {
  buildOrderDeliveredEmailTemplate,
  buildOrderPlacedEmailTemplate,
  buildOtpEmailTemplate,
  escapeHtml,
} from '@/server/email/templates';
import { DEFAULT_EMAIL_FROM } from '@/shared/constants';
import type { OrderBoard } from '@/shared/types';

const EM_DASH_RE = /—/;
const BULLET_LINE_RE = /^\s*(?:[•◦]|[-*]\s+)/m;

const sampleOrder: OrderBoard = {
  orderId: 'PC-7K3M9QX2TB',
  stage: 0,
  stages: [{ stage: 0, label: 'Đã đặt hàng', reachedAt: '2026-11-26T10:00:00.000Z' }],
  isCompleted: false,
  isCancelled: false,
  cancelledAt: null,
  canCancel: true,
  customer: {
    fullName: 'Nguyễn Văn <script>alert(1)</script>',
    phoneMasked: '091***5678',
    addressLine: '12 Nguyễn Huệ, Hoàn Kiếm, Hà Nội',
    note: null,
  },
  paymentMethod: 'bank_transfer',
  paymentReference: 'TTABCDEF12',
  items: [
    {
      productName: 'AMD Ryzen 7 9800X3D & GPU <Pro>',
      category: 'cpu',
      imageUrl: null,
      unitPriceVnd: 12_500_000,
      quantity: 2,
      lineTotalVnd: 25_000_000,
    },
  ],
  totalQuantity: 2,
  subtotalVnd: 25_000_000,
  shippingFeeVnd: 0,
  totalVnd: 25_000_000,
  createdAt: '2026-11-26T10:00:00.000Z',
};

describe('email/resend & templates', () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalEmailFrom = process.env.EMAIL_FROM;
  const originalResendApiUrl = process.env.RESEND_API_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;

    if (originalEmailFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalEmailFrom;

    if (originalResendApiUrl === undefined) delete process.env.RESEND_API_URL;
    else process.env.RESEND_API_URL = originalResendApiUrl;

    vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test');
    vi.restoreAllMocks();
  });

  it('escapes HTML entities and builds safe OTP and order templates without em-dashes or bullets', () => {
    expect(escapeHtml(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');

    const templates = [
      buildOtpEmailTemplate({ purpose: 'register', code: '012345', displayName: '<b>An</b>' }),
      buildOtpEmailTemplate({ purpose: 'facebook_verify', code: '654321' }),
      buildOtpEmailTemplate({ purpose: 'password_reset', code: '998877', displayName: 'Bình' }),
      buildOrderPlacedEmailTemplate({ order: sampleOrder, siteUrl: 'https://coreraster.me/' }),
      buildOrderPlacedEmailTemplate({
        order: { ...sampleOrder, totalQuantity: 1, shippingFeeVnd: 50_000, totalVnd: 25_050_000 },
        siteUrl: 'https://coreraster.me',
      }),
      buildOrderDeliveredEmailTemplate({ order: sampleOrder, siteUrl: 'https://coreraster.me' }),
    ];

    for (const tpl of templates) {
      expect(tpl.subject).not.toMatch(EM_DASH_RE);
      expect(tpl.html).not.toMatch(EM_DASH_RE);
      expect(tpl.text).not.toMatch(EM_DASH_RE);
      expect(tpl.text).not.toMatch(BULLET_LINE_RE);
    }

    const placedHtml = templates[3].html;
    expect(placedHtml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(placedHtml).toContain('&amp; GPU &lt;Pro&gt;');
    expect(placedHtml).toContain('https://coreraster.me/orders/PC-7K3M9QX2TB');
    expect(templates[4].text).toContain('50.000 đ');
    expect(templates[5].subject).toContain('PC-7K3M9QX2TB');
  });

  it('sends mail via Resend HTTP API when RESEND_API_KEY is configured and handles dev/prod fallbacks', async () => {
    delete process.env.EMAIL_FROM;
    expect(resolveEmailFrom()).toBe(DEFAULT_EMAIL_FROM);

    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.EMAIL_FROM = 'CoreRaster <no-reply@coreraster.me>';

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }),
    );

    const res = await sendEmail(
      {
        to: 'user@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
        text: 'Hi',
      },
      fetchMock,
    );
    expect(res).toEqual({ id: 'email_123' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key_123');

    process.env.RESEND_API_URL = 'http://127.0.0.1:3199/emails';
    const overrideFetch = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email_local' }), { status: 200 }),
    );
    const overrideRes = await sendEmail(
      { to: 'user@example.com', subject: 'Local', html: '<p>Hi</p>', text: 'Hi' },
      overrideFetch,
    );
    expect(overrideRes).toEqual({ id: 'email_local' });
    expect(overrideFetch.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3199/emails');
    delete process.env.RESEND_API_URL;

    const failFetch = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('bad key', { status: 403 }),
    );
    await expect(
      sendEmail({ to: 'a@b.com', subject: 's', html: '<p>s</p>', text: 's' }, failFetch),
    ).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED', status: 503 });

    delete process.env.RESEND_API_KEY;
    vi.stubEnv('NODE_ENV', 'test');
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const devRes = await sendEmail({
      to: 'dev@example.com',
      subject: 'OTP',
      html: '<p>123456</p>',
      text: '123456',
    });
    expect(devRes).toEqual({ id: 'dev-console' });
    expect(infoSpy).toHaveBeenCalledTimes(1);

    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      sendEmail({ to: 'prod@example.com', subject: 'OTP', html: '<p>1</p>', text: '1' }),
    ).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED', status: 503 });
  });
});
