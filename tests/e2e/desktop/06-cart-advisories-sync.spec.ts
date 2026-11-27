import {
  addProductToCartFromCatalog,
  expect,
  gotoReady,
  loginAsAdmin,
  test,
} from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import { isExternalTarget, resetAndSeedE2eDb } from '../helpers/e2e-db';
import { DEMO_NOTICE_STORAGE_KEY } from '../../../src/shared/constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Cart Limits, Advisories & Multi-Context Admin Sync', () => {
  test.skip(isExternalTarget(), 'Multi-context Admin sync modifies products in local Docker DB.');

  test.beforeAll(() => {
    resetAndSeedE2eDb();
  });

  test.afterAll(() => {
    resetAndSeedE2eDb();
  });

  test('calculates shipping threshold, enforces max qty 100, confirms deletion, and persists advisory pill', async ({ page }) => {
    await gotoReady(page, '/cart');
    await expect(page.getByTestId(TEST_IDS.cart.emptyNotice)).toBeVisible();

    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuRyzen9800x3d);
    await gotoReady(page, '/cart');

    await expect(page.getByTestId(TEST_IDS.cart.item(E2E_SEED_IDS.cpuRyzen9800x3d))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.cart.shipping)).toContainText('50.000');

    await page.getByTestId(TEST_IDS.cart.qtyInc(E2E_SEED_IDS.cpuRyzen9800x3d)).click();
    await expect(page.getByTestId(TEST_IDS.cart.shipping)).toContainText('Miễn phí');

    const qtyInput = page.getByTestId(TEST_IDS.cart.qtyInput(E2E_SEED_IDS.cpuRyzen9800x3d));
    await qtyInput.fill('150');
    await qtyInput.blur();
    await expect(qtyInput).toHaveValue('100');

    await page.getByTestId(TEST_IDS.cart.remove(E2E_SEED_IDS.cpuRyzen9800x3d)).click();
    await page.getByTestId(TEST_IDS.cart.removeCancel).click();
    await expect(page.getByTestId(TEST_IDS.cart.item(E2E_SEED_IDS.cpuRyzen9800x3d))).toBeVisible();

    await page.getByTestId(TEST_IDS.cart.remove(E2E_SEED_IDS.cpuRyzen9800x3d)).click();
    await page.getByTestId(TEST_IDS.cart.removeConfirm).click();
    await expect(page.getByTestId(TEST_IDS.cart.emptyNotice)).toBeVisible();

    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuRyzen9800x3d);
    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuCoreUltra9);
    await addProductToCartFromCatalog(page, 'gpu', E2E_SEED_IDS.gpuAstral5090);
    await gotoReady(page, '/cart');

    await expect(page.getByTestId(TEST_IDS.cart.advisoryBanner)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.cart.advisoryItem('multi_cpu_conflict'))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.cart.advisoryItem('psu_recommendation'))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.cart.advisoryItem('gpu_large_size'))).toBeVisible();

    await page.getByTestId(TEST_IDS.cart.advisoryDismiss).click();
    await expect(page.getByTestId(TEST_IDS.cart.advisoryPill)).toBeVisible();

    await gotoReady(page, '/cart');
    await expect(page.getByTestId(TEST_IDS.cart.advisoryPill)).toBeVisible();
    await page.getByTestId(TEST_IDS.cart.advisoryReopen).click();
    await expect(page.getByTestId(TEST_IDS.cart.advisoryBanner)).toBeVisible();
  });

  test('syncs customer cart when admin updates product price and soft-deletes product', async ({ browser, page }) => {
    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuCoreI514600k);
    await gotoReady(page, '/cart');

    const subtotalEl = page.getByTestId(TEST_IDS.cart.subtotal);
    const originalSubtotal = await subtotalEl.innerText();

    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    await adminContext.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, '1');
    }, DEMO_NOTICE_STORAGE_KEY);
    const adminPage = await adminContext.newPage();

    try {
      await gotoReady(adminPage, '/admin/products');
      await loginAsAdmin(adminPage);
      await expect(adminPage.getByText(/Trang 1 \//)).toBeVisible();

      const editBtn = adminPage.getByTestId(TEST_IDS.admin.productEdit(E2E_SEED_IDS.cpuCoreI514600k));
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if ((await editBtn.count()) > 0 && (await editBtn.isVisible())) {
          break;
        }
        const nextBtn = adminPage.getByTestId(TEST_IDS.listing.paginationNext('admin-cpu'));
        if ((await nextBtn.count()) === 0 || (await nextBtn.isDisabled())) {
          break;
        }
        await nextBtn.click();
        await expect(adminPage.getByText(new RegExp(`Trang ${attempt + 2} /`))).toBeVisible();
      }
      await expect(editBtn).toBeVisible();
      await editBtn.click();

      const priceInput = adminPage.getByLabel('Giá bán (VND)');
      await priceInput.fill('8888000');
      await adminPage.getByTestId(TEST_IDS.admin.productSave).click();
      await expect(adminPage.getByTestId(TEST_IDS.admin.productSave)).toHaveCount(0);

      await gotoReady(page, '/cart');
      await expect(subtotalEl).toContainText('8.888.000');
      expect(await subtotalEl.innerText()).not.toBe(originalSubtotal);

      const deleteBtn = adminPage.getByTestId(
        TEST_IDS.admin.productDelete(E2E_SEED_IDS.cpuCoreI514600k),
      );
      await expect(deleteBtn).toBeVisible();
      await deleteBtn.click();
      await adminPage.getByTestId(TEST_IDS.admin.deleteConfirm).click();
      await expect(
        adminPage.getByTestId(TEST_IDS.admin.productRow(E2E_SEED_IDS.cpuCoreI514600k)),
      ).toHaveCount(0);

      await gotoReady(page, '/cart');
      await expect(page.getByTestId(TEST_IDS.cart.emptyNotice)).toBeVisible();
    } finally {
      await adminContext.close();
    }
  });
});
