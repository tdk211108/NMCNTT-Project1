import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { E2E_MOCK_RESEND_PORT } from './e2e-constants';

export interface CapturedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  receivedAt: string;
}

const capturedEmails: CapturedEmail[] = [];
let sequence = 0;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${E2E_MOCK_RESEND_PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/emails') {
    const auth = (req.headers.authorization ?? '').trim();
    if (!auth.startsWith('Bearer ') || auth.length <= 'Bearer '.length) {
      sendJson(res, 401, { message: 'Missing Bearer token' });
      return;
    }

    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw) as {
        from?: string;
        to?: string[] | string;
        subject?: string;
        html?: string;
        text?: string;
      };
      const toList = Array.isArray(parsed.to)
        ? parsed.to.map((item) => String(item))
        : parsed.to
          ? [String(parsed.to)]
          : [];
      sequence += 1;
      const entry: CapturedEmail = {
        id: `e2e-email-${sequence}`,
        from: String(parsed.from ?? ''),
        to: toList,
        subject: String(parsed.subject ?? ''),
        html: String(parsed.html ?? ''),
        text: String(parsed.text ?? ''),
        receivedAt: new Date().toISOString(),
      };
      capturedEmails.push(entry);
      sendJson(res, 200, { id: entry.id });
    } catch {
      sendJson(res, 400, { message: 'Invalid JSON payload' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/captured') {
    const toFilter = (url.searchParams.get('to') ?? '').trim().toLowerCase();
    const filtered = toFilter
      ? capturedEmails.filter((item) => item.to.some((addr) => addr.toLowerCase() === toFilter))
      : capturedEmails;
    sendJson(res, 200, { emails: filtered });
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/captured') {
    capturedEmails.length = 0;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { message: 'Not found' });
});

server.listen(E2E_MOCK_RESEND_PORT, '127.0.0.1', () => {
  console.info(`[e2e-mock-resend] listening on http://127.0.0.1:${E2E_MOCK_RESEND_PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
