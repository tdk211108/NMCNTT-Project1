import { z } from 'zod';
import {
  CART_MAX_ITEMS,
  CART_MAX_QTY,
  CART_MIN_QTY,
  FULL_NAME_MAX_LEN,
  FULL_NAME_MIN_LEN,
  NOTE_MAX_LEN,
  ORDER_ID_REGEX,
  STREET_MAX_LEN,
  STREET_MIN_LEN,
  VN_PHONE_REGEX,
} from '../constants';
import { productIdSchema } from './catalog';

export function normalizeWhitespaceNfc(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function normalizeVnPhone(raw: string): string {
  const cleaned = raw.replace(/[\s.-]/g, '');
  if (cleaned.startsWith('+84')) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith('84')) return `0${cleaned.slice(2)}`;
  return cleaned;
}

export const cartItemInputSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().min(CART_MIN_QTY).max(CART_MAX_QTY),
  knownUnitPriceVnd: z.number().int().positive().nullable().optional(),
});

export const cartQuoteRequestSchema = z.object({
  items: z.array(cartItemInputSchema).max(CART_MAX_ITEMS),
});

export const customerInputSchema = z.object({
  fullName: z
    .string()
    .transform(normalizeWhitespaceNfc)
    .pipe(
      z
        .string()
        .min(FULL_NAME_MIN_LEN)
        .max(FULL_NAME_MAX_LEN)
        .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), 'Control characters are not allowed'),
    ),
  phone: z
    .string()
    .transform(normalizeVnPhone)
    .pipe(z.string().regex(VN_PHONE_REGEX, 'Số điện thoại Việt Nam không hợp lệ')),
  provinceCode: z.string().trim().min(1),
  wardCode: z.string().trim().min(1),
  streetAddress: z
    .string()
    .transform(normalizeWhitespaceNfc)
    .pipe(z.string().min(STREET_MIN_LEN).max(STREET_MAX_LEN)),
  note: z
    .string()
    .transform(normalizeWhitespaceNfc)
    .pipe(z.string().max(NOTE_MAX_LEN))
    .optional(),
});

export const paymentMethodSchema = z.enum(['cod', 'bank_transfer', 'card']);

export const checkoutItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().min(CART_MIN_QTY).max(CART_MAX_QTY),
});

export const checkoutRequestSchema = z.object({
  idempotencyKey: z.uuid(),
  items: z.array(checkoutItemSchema).min(1).max(CART_MAX_ITEMS),
  customer: customerInputSchema,
  paymentMethod: paymentMethodSchema,
});

export const orderLookupSchema = z.object({
  orderId: z.string().trim().toUpperCase().regex(ORDER_ID_REGEX),
  phone: z.string().transform(normalizeVnPhone).pipe(z.string().regex(VN_PHONE_REGEX)),
});

export const orderAdvanceSchema = z.object({
  expectedStage: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
