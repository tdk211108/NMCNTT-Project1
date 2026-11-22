import type { Category, OrderStage, PaymentMethod } from './common';
import type { RemovedItem } from './catalog';

export interface CartItemInput {
  productId: string;
  quantity: number;
  knownUnitPriceVnd?: number | null;
}

export interface CartLine {
  productId: string;
  name: string;
  category: Category;
  imageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
  priceChange: { fromVnd: number; toVnd: number } | null;
}

export interface CartQuote {
  lines: CartLine[];
  removed: RemovedItem[];
  totalQuantity: number;
  subtotalVnd: number;
  shippingFeeVnd: 0 | 50000;
  freeShipping: boolean;
  totalVnd: number;
}

export interface CustomerInput {
  fullName: string;
  phone: string;
  provinceCode: string;
  wardCode: string;
  streetAddress: string;
  note?: string;
}

export interface CheckoutRequest {
  idempotencyKey: string;
  items: { productId: string; quantity: number }[];
  customer: CustomerInput;
  paymentMethod: PaymentMethod;
}

export interface NormalizedCustomer {
  fullName: string;
  phone: string;
  phoneMasked: string;
  provinceName: string;
  wardName: string;
  streetAddress: string;
  note: string | null;
  addressLine: string;
}

export interface BankInstructions {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amountVnd: number;
  transferMemo: string;
  qrImageDataUrl: string;
}

export interface PrepareResponse {
  quote: CartQuote;
  customer: NormalizedCustomer;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  bankInstructions: BankInstructions | null;
}

export interface OrderItemView {
  productName: string;
  category: Category;
  imageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface OrderStageEntry {
  stage: OrderStage;
  label: string;
  reachedAt: string | null;
}

export interface OrderBoard {
  orderId: string;
  stage: OrderStage;
  stages: OrderStageEntry[];
  isCompleted: boolean;
  customer: {
    fullName: string;
    phoneMasked: string;
    addressLine: string;
    note: string | null;
  };
  paymentMethod: PaymentMethod;
  paymentReference: string;
  items: OrderItemView[];
  totalQuantity: number;
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  createdAt: string;
}

export interface OrderWithToken {
  order: OrderBoard;
  accessToken: string;
  replayed?: boolean;
}

export interface CustomerOrderSummary {
  orderId: string;
  customerName: string;
  totalQuantity: number;
  totalVnd: number;
  stage: OrderStage;
  stageLabel: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}
