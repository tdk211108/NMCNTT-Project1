'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { OrderWithToken } from '@/shared/types';
import { OrderBoardPanel } from './OrderBoardView';

export interface OrderStatusModalProps {
  placedOrder: OrderWithToken | null;
  isAdvancing: boolean;
  isCancelling?: boolean;
  onCopyOrderId: () => void | Promise<void>;
  onAdvanceStage: () => void;
  onCancelOrder?: () => void | Promise<void>;
  onContinueShopping: () => void;
  onViewMyOrders: () => void;
  onClose: () => void;
}

/**
 * Full interactive order status dialog displayed immediately after checkout completes.
 */
export function OrderStatusModal({
  placedOrder,
  isAdvancing,
  isCancelling = false,
  onCopyOrderId,
  onAdvanceStage,
  onCancelOrder,
  onContinueShopping,
  onViewMyOrders,
  onClose,
}: OrderStatusModalProps) {
  if (!placedOrder) {
    return null;
  }

  return (
    <Modal
      open={Boolean(placedOrder)}
      title={VI_MESSAGES.orders.placedModalTitle}
      onClose={onClose}
      dismissible
      testId={TEST_IDS.orders.placedModal}
      dialogClassName="max-w-4xl max-h-[90dvh] overflow-y-auto"
    >
      <div className="flex flex-col gap-5">
        <p className="rounded-control border-2 border-success bg-highlight px-3 py-2 text-sm font-medium text-highlight-fg">
          {VI_MESSAGES.orders.placedModalSubtitle}
        </p>

        <OrderBoardPanel
          board={placedOrder.order}
          isAdvancing={isAdvancing}
          isCancelling={isCancelling}
          onCopyOrderId={onCopyOrderId}
          onAdvanceStage={onAdvanceStage}
          onCancelOrder={onCancelOrder}
          compactHeading
        />

        <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-border pt-4">
          <Button
            variant="outline"
            data-testid={TEST_IDS.orders.placedContinueShopping}
            onClick={onContinueShopping}
          >
            {VI_MESSAGES.orders.placedContinueShopping}
          </Button>
          <Button
            variant="secondary"
            data-testid={TEST_IDS.orders.placedMyOrders}
            onClick={onViewMyOrders}
          >
            {VI_MESSAGES.orders.placedMyOrders}
          </Button>
          <Button
            variant="primary"
            data-testid={TEST_IDS.orders.placedCloseView}
            onClick={onClose}
          >
            {VI_MESSAGES.orders.placedCloseView}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
