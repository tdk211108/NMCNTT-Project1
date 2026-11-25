import { showToast } from '@/components/ui/toast-store';
import { useAuthUiStore } from '@/features/auth/useAuthSession';
import { ApiClientError } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';

export function handleAdminApiError(
  error: unknown,
  onUnauthorizedInvalidate?: () => void,
): void {
  if (error instanceof ApiClientError && error.code === 'UNAUTHORIZED') {
    onUnauthorizedInvalidate?.();
    useAuthUiStore.getState().openAuthModal({ tab: 'login' });
    showToast(VI_MESSAGES.admin.loginRequiredNotice, 'warning');
    return;
  }
  showToast(
    error instanceof Error ? error.message : VI_MESSAGES.common.unexpectedError,
    'error',
  );
}
