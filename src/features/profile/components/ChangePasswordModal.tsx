'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { submitFormOnEnterExcludingButtons } from '@/lib/client-hooks';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export interface ChangePasswordModalProps {
  open: boolean;
  isSubmitting: boolean;
  serverError: string | null;
  onClose: () => void;
  onResetServerError: () => void;
  onSubmit: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<unknown>;
}

export function ChangePasswordModal({
  open,
  isSubmitting,
  serverError,
  onClose,
  onResetServerError,
  onSubmit,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function resetFieldsAndClose() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLocalError(null);
    onClose();
  }

  const displayError = localError ?? serverError;

  return (
    <Modal
      open={open}
      title={VI_MESSAGES.profile.changePasswordModalTitle}
      onClose={resetFieldsAndClose}
      testId={TEST_IDS.profile.changePasswordModal}
    >
      <form
        onKeyDown={(e) => submitFormOnEnterExcludingButtons(e, isSubmitting)}
        onSubmit={async (e) => {
          e.preventDefault();
          if (newPassword !== confirmPassword) {
            setLocalError(VI_MESSAGES.auth.passwordMismatchError);
            return;
          }
          if (newPassword === currentPassword) {
            setLocalError(VI_MESSAGES.auth.passwordSameAsCurrentError);
            return;
          }
          setLocalError(null);
          try {
            await onSubmit({
              currentPassword,
              newPassword,
              confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          } catch {
            // Server error is exposed via props.serverError.
          }
        }}
        className="flex flex-col gap-3"
      >
        {displayError ? (
          <p
            role="alert"
            data-testid={TEST_IDS.profile.changePasswordError}
            className="rounded-control border-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {displayError}
          </p>
        ) : null}

        <PasswordInput
          id="profile-current-password"
          name="currentPassword"
          label={VI_MESSAGES.profile.currentPasswordLabel}
          autoComplete="current-password"
          spellCheck={false}
          enterKeyHint="next"
          required
          autoFocus
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setLocalError(null);
            onResetServerError();
          }}
          data-testid={TEST_IDS.profile.currentPassword}
          toggleTestId={TEST_IDS.profile.currentPasswordToggle}
        />

        <PasswordInput
          id="profile-new-password"
          name="newPassword"
          label={VI_MESSAGES.profile.newPasswordLabel}
          autoComplete="new-password"
          spellCheck={false}
          enterKeyHint="next"
          required
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setLocalError(null);
            onResetServerError();
          }}
          data-testid={TEST_IDS.profile.newPassword}
          toggleTestId={TEST_IDS.profile.newPasswordToggle}
        />

        <PasswordInput
          id="profile-confirm-password"
          name="confirmPassword"
          label={VI_MESSAGES.profile.confirmPasswordLabel}
          autoComplete="new-password"
          spellCheck={false}
          enterKeyHint="done"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setLocalError(null);
            onResetServerError();
          }}
          data-testid={TEST_IDS.profile.confirmPassword}
          toggleTestId={TEST_IDS.profile.confirmPasswordToggle}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="secondary" onClick={resetFieldsAndClose}>
            {VI_MESSAGES.common.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            data-testid={TEST_IDS.profile.changePasswordSubmit}
          >
            {VI_MESSAGES.profile.changePasswordSubmit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
