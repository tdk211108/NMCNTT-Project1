import 'server-only';

import { formatNumberVi } from '@/lib/format';
import { OTP_TTL_MINUTES, WARRANTY_MONTHS } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard, OtpPurpose } from '@/shared/types';

export interface BuiltEmailContent {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

function formatVndEmail(amount: number): string {
  return `${formatNumberVi(amount)} đ`;
}

function renderEmailShell(params: {
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111318;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:2px solid #181a20;border-radius:10px;overflow:hidden;">
    <tr>
      <td style="background-color:#0d0e11;padding:18px 24px;border-bottom:3px solid #e11d48;">
        <div style="font-size:18px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">CORERASTER</div>
        <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">${escapeHtml(VI_MESSAGES.brand.tagline)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        ${params.bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#475569;line-height:1.5;">
        Email tự động gửi từ hệ thống CoreRaster (coreraster.me). Vui lòng không trả lời email này.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const OTP_COPY_BY_PURPOSE: Record<
  OtpPurpose,
  { subject: string; heading: string; intro: string }
> = {
  register: {
    subject: '[CoreRaster] Mã OTP xác thực đăng ký tài khoản',
    heading: 'Xác thực email đăng ký tài khoản',
    intro:
      'Bạn đang thực hiện đăng ký tài khoản mới tại CoreRaster. Vui lòng nhập mã OTP bên dưới để hoàn tất kích hoạt.',
  },
  facebook_verify: {
    subject: '[CoreRaster] Mã OTP xác thực email cho tài khoản Facebook',
    heading: 'Xác thực email cho đăng nhập Facebook',
    intro:
      'Bạn đã đăng nhập CoreRaster bằng Facebook. Vui lòng nhập mã OTP bên dưới để xác thực và liên kết địa chỉ email của bạn.',
  },
  password_reset: {
    subject: '[CoreRaster] Mã OTP đặt lại mật khẩu',
    heading: 'Yêu cầu đặt lại mật khẩu',
    intro:
      'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CoreRaster gắn với email này. Nhập mã OTP bên dưới để tiếp tục.',
  },
};

export function buildOtpEmailTemplate(params: {
  purpose: OtpPurpose;
  code: string;
  displayName?: string | null;
  expiresMinutes?: number;
}): BuiltEmailContent {
  const copy = OTP_COPY_BY_PURPOSE[params.purpose];
  const expiresMinutes = params.expiresMinutes ?? OTP_TTL_MINUTES;
  const greeting = params.displayName?.trim()
    ? `Xin chào ${params.displayName.trim()},`
    : 'Xin chào quý khách,';

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:20px;color:#0d0e11;">${escapeHtml(copy.heading)}</h1>
    <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#1e293b;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(copy.intro)}</p>
    <div style="margin:0 0 18px 0;padding:18px;border:2px solid #e11d48;border-radius:8px;background-color:#fff1f2;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9f1239;margin-bottom:6px;">MÃ XÁC THỰC OTP</div>
      <div style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#0d0e11;">${escapeHtml(params.code)}</div>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#334155;">Mã có hiệu lực trong <strong>${expiresMinutes} phút</strong> và chỉ dùng được một lần.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email và không chia sẻ mã cho bất kỳ ai.</p>
  `;

  const text = [
    copy.heading,
    '',
    greeting,
    copy.intro,
    '',
    `Ma OTP cua ban: ${params.code}`,
    `Ma co hieu luc trong ${expiresMinutes} phut va chi su dung mot lan.`,
    'Neu ban khong thuc hien yeu cau nay, vui long bo qua email.',
  ].join('\n');

  return {
    subject: copy.subject,
    html: renderEmailShell({
      title: copy.subject,
      preheader: `Mã OTP của bạn là ${params.code} (hết hạn sau ${expiresMinutes} phút)`,
      bodyHtml,
    }),
    text,
  };
}

export function buildOrderPlacedEmailTemplate(params: {
  order: OrderBoard;
  siteUrl: string;
}): BuiltEmailContent {
  const { order } = params;
  const orderUrl = `${params.siteUrl.replace(/\/+$/, '')}/orders/${encodeURIComponent(order.orderId)}`;
  const paymentLabel = VI_MESSAGES.checkout.paymentMethods[order.paymentMethod];
  const shippingLabel =
    order.shippingFeeVnd === 0
      ? VI_MESSAGES.common.freeShippingLabel
      : formatVndEmail(order.shippingFeeVnd);

  const itemsRowsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${escapeHtml(item.productName)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;color:#334155;">${item.quantity}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:600;color:#0f172a;">${escapeHtml(formatVndEmail(item.lineTotalVnd))}</td>
        </tr>
      `,
    )
    .join('');

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:20px;color:#0d0e11;">Đặt hàng thành công</h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#1e293b;">Xin chào ${escapeHtml(order.customer.fullName)}, đơn hàng <strong>${escapeHtml(order.orderId)}</strong> của bạn đã được hệ thống CoreRaster ghi nhận.</p>
    <div style="margin:0 0 16px 0;padding:12px 14px;border:1px solid #cbd5e1;border-radius:8px;background-color:#f8fafc;font-size:13px;line-height:1.6;color:#334155;">
      <div><strong>Mã đơn hàng:</strong> ${escapeHtml(order.orderId)}</div>
      <div><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentLabel)}</div>
      <div><strong>Mã tham chiếu:</strong> ${escapeHtml(order.paymentReference)}</div>
      <div><strong>Địa chỉ nhận hàng:</strong> ${escapeHtml(order.customer.addressLine)}</div>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:14px;">
      <thead>
        <tr style="background-color:#f1f5f9;">
          <th align="left" style="padding:8px 10px;font-size:12px;color:#475569;text-transform:uppercase;">Sản phẩm</th>
          <th align="center" style="padding:8px 10px;font-size:12px;color:#475569;text-transform:uppercase;">SL</th>
          <th align="right" style="padding:8px 10px;font-size:12px;color:#475569;text-transform:uppercase;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;font-size:13px;color:#334155;">
      <tr>
        <td style="padding:4px 0;">Tạm tính (${order.totalQuantity} sản phẩm)</td>
        <td align="right" style="padding:4px 0;">${escapeHtml(formatVndEmail(order.subtotalVnd))}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;">Phí vận chuyển</td>
        <td align="right" style="padding:4px 0;">${escapeHtml(shippingLabel)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0 0;border-top:2px solid #0d0e11;font-size:15px;font-weight:700;color:#0d0e11;">Tổng thanh toán</td>
        <td align="right" style="padding:8px 0 0 0;border-top:2px solid #0d0e11;font-size:16px;font-weight:800;color:#e11d48;">${escapeHtml(formatVndEmail(order.totalVnd))}</td>
      </tr>
    </table>
    <div style="text-align:center;">
      <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:11px 22px;background-color:#e11d48;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;">Theo dõi đơn hàng</a>
    </div>
  `;

  const itemsText = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.productName} x${item.quantity} (${formatVndEmail(item.lineTotalVnd)})`,
    )
    .join('\n');

  const text = [
    `Xac nhan dat hang thanh cong: ${order.orderId}`,
    `Nguoi nhan: ${order.customer.fullName}`,
    `Dia chi: ${order.customer.addressLine}`,
    `Thanh toan: ${paymentLabel}`,
    '',
    'Chi tiet san pham:',
    itemsText,
    '',
    `Tam tinh: ${formatVndEmail(order.subtotalVnd)}`,
    `Phi van chuyen: ${shippingLabel}`,
    `Tong thanh toan: ${formatVndEmail(order.totalVnd)}`,
    `Theo doi don hang: ${orderUrl}`,
  ].join('\n');

  return {
    subject: `[CoreRaster] Xác nhận đơn hàng ${order.orderId}`,
    html: renderEmailShell({
      title: `Xác nhận đơn hàng ${order.orderId}`,
      preheader: `Đơn hàng ${order.orderId} trị giá ${formatVndEmail(order.totalVnd)} đã được ghi nhận.`,
      bodyHtml,
    }),
    text,
  };
}

export function buildOrderDeliveredEmailTemplate(params: {
  order: OrderBoard;
  siteUrl: string;
}): BuiltEmailContent {
  const { order } = params;
  const orderUrl = `${params.siteUrl.replace(/\/+$/, '')}/orders/${encodeURIComponent(order.orderId)}`;

  const bodyHtml = `
    <h1 style="margin:0 0 12px 0;font-size:20px;color:#047857;">Giao hàng thành công</h1>
    <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#1e293b;">Xin chào ${escapeHtml(order.customer.fullName)}, đơn hàng <strong>${escapeHtml(order.orderId)}</strong> của bạn đã được giao thành công.</p>
    <div style="margin:0 0 16px 0;padding:12px 14px;border:1px solid #a7f3d0;border-radius:8px;background-color:#ecfdf5;font-size:13px;line-height:1.6;color:#065f46;">
      <div><strong>Mã đơn hàng:</strong> ${escapeHtml(order.orderId)}</div>
      <div><strong>Số lượng sản phẩm:</strong> ${order.totalQuantity} sản phẩm</div>
      <div><strong>Tổng giá trị đơn:</strong> ${escapeHtml(formatVndEmail(order.totalVnd))}</div>
      <div><strong>Chế độ bảo hành:</strong> Chính hãng ${WARRANTY_MONTHS} tháng theo chính sách CoreRaster</div>
    </div>
    <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;color:#334155;">Cảm ơn bạn đã tin tưởng mua sắm linh kiện tại CoreRaster. Nếu cần hỗ trợ kỹ thuật hoặc bảo hành, bạn có thể mở lại chi tiết đơn hàng bất kỳ lúc nào.</p>
    <div style="text-align:center;">
      <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:11px 22px;background-color:#0d0e11;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;">Xem chi tiết đơn hàng</a>
    </div>
  `;

  const text = [
    `Don hang ${order.orderId} da giao thanh cong.`,
    `Nguoi nhan: ${order.customer.fullName}`,
    `So luong: ${order.totalQuantity} san pham`,
    `Tong gia tri: ${formatVndEmail(order.totalVnd)}`,
    `Bao hanh chinh hang ${WARRANTY_MONTHS} thang.`,
    `Xem chi tiet don hang: ${orderUrl}`,
  ].join('\n');

  return {
    subject: `[CoreRaster] Đơn hàng ${order.orderId} đã giao thành công`,
    html: renderEmailShell({
      title: `Đơn hàng ${order.orderId} đã giao thành công`,
      preheader: `Đơn hàng ${order.orderId} đã hoàn tất giao hàng.`,
      bodyHtml,
    }),
    text,
  };
}
