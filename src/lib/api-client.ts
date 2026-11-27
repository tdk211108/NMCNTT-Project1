import type { ApiError, ErrorCode } from '@/shared/types';
import { VI_MESSAGES } from '@/shared/messages/vi';

export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function extractApiErrorMessage(error: unknown): string | null {
  if (!error || !(error instanceof Error)) {
    return null;
  }
  if (error instanceof ApiClientError && error.details) {
    const fieldErrors = error.details.fieldErrors as Record<string, unknown> | undefined;
    if (fieldErrors && typeof fieldErrors === 'object') {
      for (const value of Object.values(fieldErrors)) {
        if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
          return value[0];
        }
      }
    }
  }
  return error.message || null;
}

async function parseErrorResponse(response: Response): Promise<ApiClientError> {
  try {
    const json = (await response.json()) as Partial<ApiError>;
    if (json?.error?.code && json.error.message) {
      return new ApiClientError(
        json.error.code,
        response.status,
        json.error.message,
        json.error.details,
      );
    }
  } catch {
    // Non-JSON error response falls back to generic message.
  }
  return new ApiClientError('INTERNAL', response.status, VI_MESSAGES.common.unexpectedError);
}

const DEFAULT_API_TIMEOUT_MS = 15_000;

export async function apiFetch<T>(
  input: string,
  init: Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;

  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }

  const signal = init.signal ?? AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      signal,
      headers,
      body,
      credentials: 'same-origin',
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || (!init.signal && error.name === 'AbortError'))
    ) {
      throw new ApiClientError('INTERNAL', 408, VI_MESSAGES.common.requestTimeoutError);
    }
    throw error;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiUpload<T>(url: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return (await response.json()) as T;
}
