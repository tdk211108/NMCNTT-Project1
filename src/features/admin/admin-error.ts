import { showToast } from '@/components/ui/toast-store';
import { ApiClientError } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { useAdminUiStore } from './useAdminSession';

export function handleAdminApiError(
  error: unknown,
  onUnauthorizedInvalidate?: () => void,
): void {
  if (error instanceof ApiClientError && error.code === 'UNAUTHORIZED') {
    onUnauthorizedInvalidate?.();
    useAdminUiStore.getState().openLoginModal();
    showToast(VI_MESSAGES.admin.loginRequiredNotice, 'warning');
    return;
  }
  showToast(
    error instanceof Error ? error.message : VI_MESSAGES.common.unexpectedError,
    'error',
  );
}
