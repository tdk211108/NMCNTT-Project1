import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { MAX_JSON_BYTES } from '@/shared/constants';
import type { SessionUser } from '@/shared/types';
import { requireAdmin, requireSession } from '../auth/session';
import { assertSameOrigin } from '../security/origin-check';
import { AppError, isDatabaseConnectionError, zodErrorToDetails } from './errors';

export interface HandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSameOrigin?: boolean;
  cacheControl?: string;
}

export async function parseJsonBody(request: NextRequest, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Dữ liệu gửi lên vượt quá kích thước cho phép.',
    });
  }

  const rawText = await request.text();
  if (Buffer.byteLength(rawText, 'utf8') > maxBytes) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Dữ liệu gửi lên vượt quá kích thước cho phép.',
    });
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Nội dung JSON không hợp lệ.',
    });
  }
}

export function jsonWithHeaders(
  data: unknown,
  init: { status?: number; cacheControl?: string; headers?: Record<string, string> } = {},
): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', init.cacheControl ?? 'no-store');
  return NextResponse.json(data, { status: init.status ?? 200, headers });
}

export function withHandler<TContext = unknown>(
  options: HandlerOptions,
  fn: (
    request: NextRequest,
    context: TContext,
    session: SessionUser | null,
  ) => Promise<NextResponse>,
): (request: NextRequest, context: TContext) => Promise<NextResponse> {
  const cacheControl = options.cacheControl ?? 'no-store';

  return async (request: NextRequest, context: TContext) => {
    try {
      let session: SessionUser | null = null;
      if (options.requireAdmin) {
        session = await requireAdmin(request);
      } else if (options.requireAuth) {
        session = await requireSession(request);
      }
      if (options.requireSameOrigin) {
        assertSameOrigin(request);
      }

      const response = await fn(request, context, session);
      if (!response.headers.has('Cache-Control')) {
        response.headers.set('Cache-Control', cacheControl);
      }
      return response;
    } catch (error) {
      if (error instanceof AppError) {
        return jsonWithHeaders(error.toApiError(), {
          status: error.status,
          cacheControl: 'no-store',
          headers: error.headers,
        });
      }

      if (error instanceof ZodError) {
        const appError = new AppError('VALIDATION_ERROR', {
          details: zodErrorToDetails(error),
        });
        return jsonWithHeaders(appError.toApiError(), {
          status: appError.status,
          cacheControl: 'no-store',
        });
      }

      if (isDatabaseConnectionError(error)) {
        console.error('[api] Database unreachable:', error);
        const appError = new AppError('INTERNAL', { status: 503 });
        return jsonWithHeaders(appError.toApiError(), {
          status: 503,
          cacheControl: 'no-store',
        });
      }

      console.error('[api] Unexpected error:', error);
      const internalError = new AppError('INTERNAL', { status: 500 });
      return jsonWithHeaders(internalError.toApiError(), {
        status: 500,
        cacheControl: 'no-store',
      });
    }
  };
}
