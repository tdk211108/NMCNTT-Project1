import 'server-only';

import { createHmac } from 'node:crypto';
import QRCode from 'qrcode';
import { STORE_DISPLAY_NAME } from '@/shared/constants';
import type { BankInstructions } from '@/shared/types';
import { getAuthSecretString } from '../auth/session';
import { mapBytesToOrderAlphabet } from '../domain/order-id';

export function derivePaymentReference(idempotencyKey: string): string {
  const digest = createHmac('sha256', getAuthSecretString()).update(idempotencyKey).digest();
  return `TT${mapBytesToOrderAlphabet(digest.subarray(0, 8))}`;
}

export function buildDemoQrPayload(
  bankName: string,
  accountNumber: string,
  amountVnd: number,
  transferMemo: string,
): string {
  return `DEMO|BANK=${bankName}|ACC=${accountNumber}|AMOUNT=${amountVnd}|MEMO=${transferMemo}`;
}

export async function buildBankInstructions(
  paymentReference: string,
  amountVnd: number,
): Promise<BankInstructions> {
  const storeName = (process.env.STORE_NAME ?? STORE_DISPLAY_NAME).trim() || STORE_DISPLAY_NAME;
  const bankName = (process.env.DEMO_BANK_NAME ?? 'CoreRaster Demo Bank').trim();
  const accountNumber = (process.env.DEMO_BANK_ACCOUNT_NO ?? '190020268888').trim();
  const accountHolder = (process.env.DEMO_BANK_ACCOUNT_HOLDER ?? 'CORERASTER HARDWARE DEMO').trim();
  const transferMemo = `${storeName} ${paymentReference}`;
  const payload = buildDemoQrPayload(bankName, accountNumber, amountVnd, transferMemo);
  const qrImageDataUrl = await QRCode.toDataURL(payload, { width: 240, margin: 1 });

  return {
    bankName,
    accountNumber,
    accountHolder,
    amountVnd,
    transferMemo,
    qrImageDataUrl,
  };
}
