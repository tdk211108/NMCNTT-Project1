import { expect, gotoReady, loginViaModal, test } from '../fixtures';
import {
  clearCapturedEmails,
  clearOrdersAndUsers,
  extractSixDigitOtp,
  isExternalTarget,
  waitForCapturedEmail,
} from '../helpers/e2e-db';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Auth Email OTP, Profile & Password Reset', () => {
  test.skip(isExternalTarget(), 'Mutating auth/OTP flows only run against isolated local Docker DB.');

  const uniqueSuffix = Date.now().toString(36).slice(-6);
  const username = `e2euser_${uniqueSuffix}`;
  const displayName = 'Khách Hàng E2E';
  const email = `e2e.${uniqueSuffix}@example.com`;
  const initialPassword = 'UserPass!123';
  const changedPassword = 'UserPass!456';
  const resetPassword = 'UserPass!789';

  test.beforeAll(async () => {
    await clearOrdersAndUsers();
    await clearCapturedEmails();
  });

  test.afterAll(async () => {
    await clearOrdersAndUsers();
    await clearCapturedEmails();
  });

  test('registers with Resend OTP, manages /profile password change, resets password via OTP, and validates OAuth UI', async ({ page }) => {
    await gotoReady(page, '/');

    await page.getByTestId(TEST_IDS.auth.headerLoginButton).click();
    const modal = page.getByTestId(TEST_IDS.auth.modal);
    await expect(modal).toBeVisible();

    await expect(page.getByTestId(TEST_IDS.auth.googleButton)).toHaveAttribute(
      'href',
      /\/api\/auth\/oauth\/google/,
    );
    await expect(page.getByTestId(TEST_IDS.auth.facebookButton)).toHaveAttribute(
      'href',
      /\/api\/auth\/oauth\/facebook/,
    );

    await page.getByTestId(TEST_IDS.auth.tabRegister).click();
    await page.getByTestId(TEST_IDS.auth.registerUsername).fill(username);
    await page.getByTestId(TEST_IDS.auth.registerDisplayName).fill(displayName);
    await page.getByTestId(TEST_IDS.auth.registerEmail).fill(email);
    await page.getByTestId(TEST_IDS.auth.registerPassword).fill(initialPassword);
    await page.getByTestId(TEST_IDS.auth.registerSubmit).click();

    await expect(page.getByTestId(TEST_IDS.auth.otpInput)).toBeVisible();
    const registerMail = await waitForCapturedEmail(
      (item) => item.to.includes(email) && item.subject.includes('xác thực'),
    );
    const registerOtp = extractSixDigitOtp(registerMail);

    await page.getByTestId(TEST_IDS.auth.otpInput).fill('000000');
    await page.getByTestId(TEST_IDS.auth.registerVerifySubmit).click();
    await expect(page.getByTestId(TEST_IDS.auth.errorAlert)).toBeVisible();

    await page.getByTestId(TEST_IDS.auth.otpInput).fill(registerOtp);
    await page.getByTestId(TEST_IDS.auth.registerVerifySubmit).click();

    await expect(modal).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId(TEST_IDS.auth.headerUserBadge)).toHaveText(displayName);

    await page.getByTestId(TEST_IDS.auth.headerProfile).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByTestId(TEST_IDS.profile.page)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.profile.displayName)).toHaveText(displayName);
    await expect(page.getByTestId(TEST_IDS.profile.username)).toContainText(username);
    await expect(page.getByTestId(TEST_IDS.profile.email)).toHaveText(email);

    await page.getByTestId(TEST_IDS.profile.tabOrders).click();
    await expect(page.getByTestId(TEST_IDS.profile.tabOrders)).toHaveAttribute('aria-selected', 'true');
    await page.getByTestId(TEST_IDS.profile.tabOverview).click();

    await page.getByTestId(TEST_IDS.profile.changePasswordOpen).click();
    const changePwModal = page.getByTestId(TEST_IDS.profile.changePasswordModal);
    await expect(changePwModal).toBeVisible();

    await page.getByTestId(TEST_IDS.profile.currentPassword).fill('WrongOldPass!1');
    await page.getByTestId(TEST_IDS.profile.newPassword).fill(changedPassword);
    await page.getByTestId(TEST_IDS.profile.confirmPassword).fill(changedPassword);
    await page.getByTestId(TEST_IDS.profile.changePasswordSubmit).click();
    await expect(page.getByTestId(TEST_IDS.profile.changePasswordError)).toBeVisible();

    await page.getByTestId(TEST_IDS.profile.currentPassword).fill(initialPassword);
    await page.getByTestId(TEST_IDS.profile.changePasswordSubmit).click();
    await expect(changePwModal).toHaveCount(0, { timeout: 15_000 });

    const dismissAllToasts = async () => {
      const toasts = page.locator('[data-toast-tone][role="status"]');
      const closeButtons = toasts.getByRole('button', { name: 'Đóng' });
      const count = await closeButtons.count();
      for (let i = 0; i < count; i += 1) {
        const btn = closeButtons.first();
        if (await btn.isVisible()) {
          await btn.click();
        }
      }
      await page.mouse.move(10, 10);
      await expect(toasts).toHaveCount(0);
    };

    const logoutAndDismissToast = async () => {
      await dismissAllToasts();
      await page.getByTestId(TEST_IDS.auth.headerLogout).click();
      await expect(page.getByTestId(TEST_IDS.auth.headerLoginButton)).toBeVisible();
      const logoutToast = page.locator('[data-toast-tone][role="status"]', {
        hasText: 'Bạn đã đăng xuất khỏi hệ thống.',
      });
      await expect(logoutToast).toBeVisible();
      await dismissAllToasts();
    };

    await logoutAndDismissToast();

    await page.getByTestId(TEST_IDS.auth.headerLoginButton).click();
    await page.getByTestId(TEST_IDS.auth.loginUsername).fill(username);
    await page.getByTestId(TEST_IDS.auth.loginPassword).fill(initialPassword);
    await page.getByTestId(TEST_IDS.auth.loginSubmit).click();
    await expect(page.getByTestId(TEST_IDS.auth.errorAlert)).toBeVisible();

    await loginViaModal(page, username, changedPassword);
    await expect(page.getByTestId(TEST_IDS.auth.headerUserBadge)).toHaveText(displayName);

    await logoutAndDismissToast();

    await clearCapturedEmails();
    await page.getByTestId(TEST_IDS.auth.headerLoginButton).click();
    await page.getByTestId(TEST_IDS.auth.forgotPasswordLink).click();
    await page.getByTestId(TEST_IDS.auth.forgotEmail).fill(email);
    await page.getByTestId(TEST_IDS.auth.forgotRequestSubmit).click();

    await expect(page.getByTestId(TEST_IDS.auth.otpInput)).toBeVisible();
    const forgotMail = await waitForCapturedEmail(
      (item) => item.to.includes(email) && item.subject.includes('mật khẩu'),
    );
    const forgotOtp = extractSixDigitOtp(forgotMail);

    await page.getByTestId(TEST_IDS.auth.otpInput).fill(forgotOtp);
    await page.getByTestId(TEST_IDS.auth.forgotNewPassword).fill(resetPassword);
    await page.getByTestId(TEST_IDS.auth.forgotConfirmPassword).fill(resetPassword);
    await page.getByTestId(TEST_IDS.auth.forgotResetSubmit).click();

    await expect(page.getByTestId(TEST_IDS.auth.loginUsername)).toBeVisible();
    await loginViaModal(page, email, resetPassword);
    await expect(page.getByTestId(TEST_IDS.auth.headerUserBadge)).toHaveText(displayName);

    await gotoReady(page, '/?authError=cancelled');
    await expect(page).toHaveURL(/\/$/);
  });
});
