import { test as base, expect, type Page } from '@playwright/test';
import { DEMO_NOTICE_STORAGE_KEY } from '../../src/shared/constants';
import { TEST_IDS } from '../../src/shared/testids';
import { E2E_ADMIN_PASSWORD } from './helpers/e2e-constants';

export interface E2eTestOptions {
  demoNoticeEnabled: boolean;
  ignorePageErrors: boolean;
}

export const test = base.extend<E2eTestOptions>({
  demoNoticeEnabled: [false, { option: true }],
  ignorePageErrors: [false, { option: true }],
  page: async ({ page, demoNoticeEnabled, ignorePageErrors }, use) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    if (!demoNoticeEnabled) {
      await page.addInitScript((storageKey) => {
        try {
          window.localStorage.setItem(storageKey, '1');
        } catch {
          // Ignore storage unavailability on non-origin frames.
        }
      }, DEMO_NOTICE_STORAGE_KEY);
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    if (!ignorePageErrors && pageErrors.length > 0) {
      throw new Error(
        `Uncaught pageerror(s) during test:\n${pageErrors.map((e) => e.stack || e.message).join('\n')}`,
      );
    }
  },
});

export { expect };

export async function waitForPreloaderDismissed(page: Page): Promise<void> {
  await expect(page.getByTestId(TEST_IDS.layout.preloader)).toHaveCount(0, {
    timeout: 20_000,
  });
}

export async function gotoReady(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForPreloaderDismissed(page);
}

export async function selectSearchableOption(
  page: Page,
  options: {
    triggerTestId: string;
    searchTestId: string;
    optionTestId: string;
    searchText?: string;
  },
): Promise<void> {
  const trigger = page.getByTestId(options.triggerTestId);
  await expect(trigger).toBeEnabled();
  await trigger.click();

  const searchInput = page.getByTestId(options.searchTestId);
  await expect(searchInput).toBeVisible();
  if (options.searchText) {
    await searchInput.fill(options.searchText);
  }

  const option = page.getByTestId(options.optionTestId).first();
  await expect(option).toBeVisible();
  await option.click();
}

export async function selectComboboxOption(
  page: Page,
  triggerTestId: string,
  optionLabel: string,
): Promise<void> {
  await page.getByTestId(triggerTestId).click();
  const option = page.getByRole('option', { name: optionLabel, exact: true });
  await expect(option).toBeVisible();
  await option.click();
}

export async function loginViaModal(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const modal = page.getByTestId(TEST_IDS.auth.modal);
  if (!(await modal.isVisible().catch(() => false))) {
    await page.getByTestId(TEST_IDS.auth.headerLoginButton).click();
    await expect(modal).toBeVisible();
  }
  await page.getByTestId(TEST_IDS.auth.loginUsername).fill(username);
  await page.getByTestId(TEST_IDS.auth.loginPassword).fill(password);
  await page.getByTestId(TEST_IDS.auth.loginSubmit).click();
  await expect(modal).toHaveCount(0, { timeout: 15_000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginViaModal(page, 'admin', E2E_ADMIN_PASSWORD);
  await expect(page.getByTestId(TEST_IDS.header.adminToggle)).toBeVisible();
}

export async function fillCheckoutForm(
  page: Page,
  overrides?: {
    fullName?: string;
    phone?: string;
    provinceCode?: string;
    provinceSearch?: string;
    wardCode?: string;
    street?: string;
    note?: string;
    paymentMethod?: 'cod' | 'bank_transfer' | 'card';
  },
): Promise<void> {
  await page.getByTestId(TEST_IDS.checkout.fullName).fill(overrides?.fullName ?? 'Nguyễn Văn Kiểm Thử');
  await page.getByTestId(TEST_IDS.checkout.phone).fill(overrides?.phone ?? '0912345678');

  const provinceCode = overrides?.provinceCode ?? '01';
  await selectSearchableOption(page, {
    triggerTestId: TEST_IDS.checkout.province,
    searchTestId: TEST_IDS.checkout.provinceSearch,
    optionTestId: TEST_IDS.checkout.provinceOption(provinceCode),
    searchText: overrides?.provinceSearch ?? 'Hà Nội',
  });

  const wardTrigger = page.getByTestId(TEST_IDS.checkout.ward);
  await expect(wardTrigger).toBeEnabled({ timeout: 15_000 });

  if (overrides?.wardCode) {
    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.checkout.ward,
      searchTestId: TEST_IDS.checkout.wardSearch,
      optionTestId: TEST_IDS.checkout.wardOption(overrides.wardCode),
    });
  } else {
    await wardTrigger.click();
    await expect(page.getByTestId(TEST_IDS.checkout.wardSearch)).toBeVisible();
    const firstWard = page.locator(`[data-testid^="checkout-ward-option-"]`).first();
    await expect(firstWard).toBeVisible();
    await firstWard.click();
  }

  await page
    .getByTestId(TEST_IDS.checkout.street)
    .fill(overrides?.street ?? 'Số 227 Nguyễn Văn Cừ, Chợ Quán');

  if (overrides?.note !== undefined) {
    await page.getByTestId(TEST_IDS.checkout.note).fill(overrides.note);
  }

  const method = overrides?.paymentMethod ?? 'cod';
  await page.getByTestId(TEST_IDS.checkout.payment(method)).check();
}

export async function addProductToCartFromCatalog(
  page: Page,
  category: 'cpu' | 'gpu',
  productId: string,
): Promise<void> {
  await gotoReady(page, `/${category}`);
  const addButton = page.getByTestId(TEST_IDS.listing.productCardAddToCart(productId));
  if ((await addButton.count()) > 0 && (await addButton.first().isVisible())) {
    await addButton.first().click();
    return;
  }
  await gotoReady(page, `/products/${productId}`);
  await page.getByTestId(TEST_IDS.detail.addToCart).click();
}
