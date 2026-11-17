import type { OrderStage } from './common';

export interface AdminSessionResponse {
  isAdmin: boolean;
}

export interface AdminOrderListItem {
  orderId: string;
  customerName: string;
  phone: string;
  totalVnd: number;
  stage: OrderStage;
  stageLabel: string;
  createdAt: string;
}

export interface AdminImageUploadResponse {
  url: string;
  storagePath: string;
}

export interface AdminResetResponse {
  ordersDeleted: number;
  productsRestored: number;
  imagesPurged: number;
  warnings: string[];
}
