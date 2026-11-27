import 'server-only';

import type { ZodError } from 'zod';
import type { ApiError, ErrorCode } from '@/shared/types';

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  EMPTY_CART: 400,
  CART_LIMIT_EXCEEDED: 400,
  IMAGE_INVALID: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN_ORIGIN: 403,
  NOT_FOUND: 404,
  ORDER_NOT_FOUND: 404,
  PRODUCT_UNAVAILABLE: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  STALE_STAGE: 409,
  ORDER_COMPLETED: 409,
  ORDER_CANCELLED: 409,
  ORDER_CANCEL_NOT_ALLOWED: 409,
  HAS_VARIANTS: 409,
  DUPLICATE_NAME: 409,
  USERNAME_TAKEN: 409,
  EMAIL_TAKEN: 409,
  OTP_INVALID: 400,
  OTP_EXPIRED: 400,
  OTP_MAX_ATTEMPTS: 400,
  OTP_COOLDOWN: 429,
  EMAIL_DELIVERY_FAILED: 503,
  OAUTH_ONLY_ACCOUNT: 400,
  INVALID_CURRENT_PASSWORD: 400,
  SERIES_NOT_RETAIL: 409,
  COMPARE_INVALID: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Dữ liệu gửi lên không hợp lệ.',
  EMPTY_CART: 'Giỏ hàng đang trống.',
  CART_LIMIT_EXCEEDED: 'Giỏ hàng chỉ chứa tối đa 20 sản phẩm khác nhau.',
  PRODUCT_UNAVAILABLE: 'Một số sản phẩm trong giỏ hàng hiện không còn kinh doanh.',
  COMPARE_INVALID: 'Không thể hiển thị bảng so sánh cho các sản phẩm đã chọn.',
  NOT_FOUND: 'Không tìm thấy dữ liệu được yêu cầu.',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng với thông tin này',
  RATE_LIMITED: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.',
  UNAUTHORIZED: 'Thông tin xác thực không hợp lệ hoặc phiên đã hết hạn.',
  FORBIDDEN_ORIGIN: 'Yêu cầu không hợp lệ từ nguồn không được phép.',
  IDEMPOTENCY_KEY_REUSED: 'Mã giao dịch đã được sử dụng cho yêu cầu khác.',
  STALE_STAGE: 'Trạng thái đơn hàng đã được cập nhật trước đó.',
  ORDER_COMPLETED: 'Đơn hàng đã hoàn tất và không thể chuyển tiếp.',
  ORDER_CANCELLED: 'Đơn hàng đã bị hủy và không thể tiếp tục xử lý.',
  ORDER_CANCEL_NOT_ALLOWED: 'Chỉ có thể hủy đơn hàng khi còn ở bước Đã đặt hàng.',
  HAS_VARIANTS: 'Vui lòng xóa các biến thể AIB trước',
  DUPLICATE_NAME: 'Tên linh kiện đã tồn tại trong danh mục đang hoạt động.',
  USERNAME_TAKEN: 'Tên đăng nhập đã được sử dụng.',
  EMAIL_TAKEN: 'Địa chỉ email này đã được đăng ký.',
  OTP_INVALID: 'Mã OTP không đúng. Vui lòng kiểm tra lại.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.',
  OTP_MAX_ATTEMPTS: 'Bạn đã nhập sai mã OTP quá số lần cho phép. Vui lòng gửi lại mã mới.',
  OTP_COOLDOWN: 'Vui lòng đợi một chút trước khi yêu cầu gửi lại mã OTP.',
  EMAIL_DELIVERY_FAILED: 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.',
  OAUTH_ONLY_ACCOUNT:
    'Tài khoản này đăng nhập qua Google hoặc Facebook và không sử dụng mật khẩu nội bộ.',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng.',
  SERIES_NOT_RETAIL: 'Dòng GPU cơ sở không tồn tại hoặc không thuộc danh mục bán lẻ.',
  IMAGE_INVALID: 'Tệp ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.',
  INTERNAL: 'Hệ thống đang bảo trì, vui lòng thử lại sau.',
};

export interface AppErrorOptions {
  message?: string;
  status?: number;
  details?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly headers?: Record<string, string>;

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    super(options?.message ?? ERROR_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status ?? ERROR_HTTP_STATUS[code];
    this.details = options?.details;
    this.headers = options?.headers;
  }

  toApiError(): ApiError {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export function zodErrorToDetails(error: ZodError): { fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }
  return { fieldErrors };
}

export function extractPgError(error: unknown): { code?: string; constraint?: string } {
  if (!error || typeof error !== 'object') {
    return {};
  }
  const direct = error as { code?: unknown; constraint?: unknown; constraint_name?: unknown; cause?: unknown };
  if (typeof direct.code === 'string') {
    const constraint =
      typeof direct.constraint === 'string'
        ? direct.constraint
        : typeof direct.constraint_name === 'string'
          ? direct.constraint_name
          : undefined;
    return { code: direct.code, constraint };
  }
  if (direct.cause) {
    return extractPgError(direct.cause);
  }
  return {};
}

const DB_UNAVAILABLE_PG_CODES = new Set(['57P01', '57P02', '57P03', '08000', '08003', '08006']);
const DB_UNAVAILABLE_NODE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'CONNECTION_ENDED',
  'CONNECTION_CLOSED',
]);

export function isDatabaseConnectionError(error: unknown): boolean {
  const pg = extractPgError(error);
  if (pg.code && (DB_UNAVAILABLE_PG_CODES.has(pg.code) || DB_UNAVAILABLE_NODE_CODES.has(pg.code))) {
    return true;
  }
  if (error && typeof error === 'object' && 'cause' in error && error.cause) {
    return isDatabaseConnectionError(error.cause);
  }
  return false;
}
