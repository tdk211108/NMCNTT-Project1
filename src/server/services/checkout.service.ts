import 'server-only';

import type { CheckoutRequest, NormalizedCustomer, PrepareResponse } from '@/shared/types';
import { resolveProvinceAndWard } from '../address/address.repo';
import { getDb, type DbExecutor } from '../db/client';
import { validateCartItems } from '../domain/cart-rules';
import {
  formatAddressLine,
  isValidFullName,
  isValidNote,
  isValidStreetAddress,
  normalizeOptionalNote,
  normalizeWhitespaceNfc,
} from '../domain/name';
import { normalizeAndValidateVnPhone } from '../domain/phone';
import { maskPhone } from '../domain/masking';
import { AppError } from '../http/errors';
import { buildBankInstructions, derivePaymentReference } from '../payments/demo-bank';
import { quoteCart } from './cart.service';

export interface ValidatedCheckoutCustomer extends NormalizedCustomer {
  provinceCode: string;
  wardCode: string;
}

export async function validateCheckoutAndQuote(
  request: CheckoutRequest,
  db: DbExecutor = getDb(),
): Promise<{
  quote: Awaited<ReturnType<typeof quoteCart>>;
  customer: ValidatedCheckoutCustomer;
}> {
  const cartCheck = validateCartItems(request.items);
  if (!cartCheck.ok) {
    throw new AppError(cartCheck.code);
  }

  const fullName = normalizeWhitespaceNfc(request.customer.fullName);
  const phone = normalizeAndValidateVnPhone(request.customer.phone);
  const streetAddress = normalizeWhitespaceNfc(request.customer.streetAddress);
  const note = normalizeOptionalNote(request.customer.note);

  const fieldErrors: Record<string, string[]> = {};
  if (!isValidFullName(fullName)) {
    fieldErrors['customer.fullName'] = ['Họ và tên phải từ 2 đến 50 ký tự hợp lệ.'];
  }
  if (!phone) {
    fieldErrors['customer.phone'] = ['Số điện thoại Việt Nam không hợp lệ.'];
  }
  if (!isValidStreetAddress(streetAddress)) {
    fieldErrors['customer.streetAddress'] = ['Địa chỉ chi tiết phải từ 10 đến 200 ký tự.'];
  }
  if (!isValidNote(note)) {
    fieldErrors['customer.note'] = ['Ghi chú tối đa 300 ký tự.'];
  }

  const resolvedAddress = resolveProvinceAndWard(
    request.customer.provinceCode,
    request.customer.wardCode,
  );
  if (!resolvedAddress) {
    fieldErrors['customer.wardCode'] = ['Tỉnh/thành hoặc phường/xã không hợp lệ.'];
  }

  if (Object.keys(fieldErrors).length > 0 || !phone || !resolvedAddress) {
    throw new AppError('VALIDATION_ERROR', { details: { fieldErrors } });
  }

  const quote = await quoteCart(
    request.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    db,
  );

  if (quote.removed.length > 0) {
    throw new AppError('PRODUCT_UNAVAILABLE', {
      details: { items: quote.removed },
    });
  }

  return {
    quote,
    customer: {
      fullName,
      phone,
      phoneMasked: maskPhone(phone),
      provinceCode: request.customer.provinceCode,
      provinceName: resolvedAddress.provinceName,
      wardCode: request.customer.wardCode,
      wardName: resolvedAddress.wardName,
      streetAddress,
      note,
      addressLine: formatAddressLine(
        streetAddress,
        resolvedAddress.wardName,
        resolvedAddress.provinceName,
      ),
    },
  };
}

export async function prepareCheckout(
  request: CheckoutRequest,
  db: DbExecutor = getDb(),
): Promise<PrepareResponse> {
  const { quote, customer } = await validateCheckoutAndQuote(request, db);
  const paymentReference = derivePaymentReference(request.idempotencyKey);
  const bankInstructions =
    request.paymentMethod === 'bank_transfer'
      ? await buildBankInstructions(paymentReference, quote.totalVnd)
      : null;

  return {
    quote,
    customer: {
      fullName: customer.fullName,
      phone: customer.phone,
      phoneMasked: customer.phoneMasked,
      provinceName: customer.provinceName,
      wardName: customer.wardName,
      streetAddress: customer.streetAddress,
      note: customer.note,
      addressLine: customer.addressLine,
    },
    paymentMethod: request.paymentMethod,
    paymentReference,
    bankInstructions,
  };
}
