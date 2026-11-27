import { expect, gotoReady, selectSearchableOption, test } from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Compare & Hardware Awards @smoke', { tag: '@smoke' }, () => {
  test('compares 2 and 3 CPUs, enforces category lock and highlight rules, and clears', async ({ page }) => {
    await gotoReady(page, '/compare');

    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.compare.slotSelect(0),
      searchTestId: TEST_IDS.compare.slotSearch(0),
      optionTestId: TEST_IDS.compare.slotOption(0, E2E_SEED_IDS.cpuRyzen9800x3d),
      searchText: '9800X3D',
    });

    await expect(page.getByTestId(TEST_IDS.compare.slotPreview(0))).toBeVisible();

    await page.getByTestId(TEST_IDS.compare.slotSelect(1)).click();
    await expect(page.getByTestId(TEST_IDS.compare.slotSearch(1))).toBeVisible();
    await expect(page.locator('[data-testid^="compare-slot-option-1-gpu-"]')).toHaveCount(0);
    await page.getByTestId(TEST_IDS.compare.slotSearch(1)).fill('285K');
    await page.getByTestId(TEST_IDS.compare.slotOption(1, E2E_SEED_IDS.cpuCoreUltra9)).click();

    await expect(page.getByTestId(TEST_IDS.compare.table)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.compare.headerImage(E2E_SEED_IDS.cpuRyzen9800x3d))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.compare.headerImage(E2E_SEED_IDS.cpuCoreUltra9))).toBeVisible();

    const ryzenPriceCell = page.getByTestId(TEST_IDS.compare.cell('price', E2E_SEED_IDS.cpuRyzen9800x3d));
    const ultraPriceCell = page.getByTestId(TEST_IDS.compare.cell('price', E2E_SEED_IDS.cpuCoreUltra9));
    const ryzenHighlight = await ryzenPriceCell.evaluate((el) => el.className.includes('bg-highlight'));
    const ultraHighlight = await ultraPriceCell.evaluate((el) => el.className.includes('bg-highlight'));
    expect(ryzenHighlight !== ultraHighlight).toBe(true);

    await expect(
      page.getByTestId(TEST_IDS.compare.cell('baseClock', E2E_SEED_IDS.cpuRyzen9800x3d)),
    ).not.toHaveClass(/bg-highlight/);

    await page.getByTestId(TEST_IDS.compare.addColumn).click();
    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.compare.slotSelect(2),
      searchTestId: TEST_IDS.compare.slotSearch(2),
      optionTestId: TEST_IDS.compare.slotOption(2, E2E_SEED_IDS.cpuCoreI514600k),
      searchText: '14600K',
    });

    await expect(page.getByTestId(TEST_IDS.compare.headerImage(E2E_SEED_IDS.cpuCoreI514600k))).toBeVisible();
    await page.getByTestId(TEST_IDS.compare.addToCart(E2E_SEED_IDS.cpuCoreI514600k)).click();
    await expect(page.getByTestId(TEST_IDS.header.cartCount)).toHaveText('1');

    await page.getByTestId(TEST_IDS.compare.clearAll).click();
    await expect(page.getByTestId(TEST_IDS.compare.table)).toHaveCount(0);
  });

  test('displays error states and single-item prompt for invalid compare URLs', async ({ page }) => {
    await gotoReady(page, `/compare?ids=${E2E_SEED_IDS.cpuRyzen9800x3d}`);
    await expect(page.getByText('Vui lòng chọn ít nhất 2 sản phẩm cùng loại')).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.compare.table)).toHaveCount(0);

    const invalidUrls = [
      `/compare?ids=${E2E_SEED_IDS.cpuRyzen9800x3d},${E2E_SEED_IDS.gpuTuf5090}`,
      `/compare?ids=${E2E_SEED_IDS.cpuRyzen9800x3d},${E2E_SEED_IDS.cpuRyzen9800x3d}`,
      `/compare?ids=${E2E_SEED_IDS.cpuRyzen9800x3d},${E2E_SEED_IDS.cpuCoreUltra9},${E2E_SEED_IDS.cpuCoreI514600k},${E2E_SEED_IDS.cpuRyzen7500f}`,
      '/compare?ids=nonexistent-e2e-1,nonexistent-e2e-2',
    ];

    for (const url of invalidUrls) {
      await gotoReady(page, url);
      await expect(page.getByTestId(TEST_IDS.compare.errorBack)).toBeVisible();
    }
  });

  test('renders CPU and GPU hardware awards and adds winner to cart on /tools/perf-per-price', async ({ page }) => {
    await gotoReady(page, '/tools/perf-per-price');

    await expect(page.getByTestId(TEST_IDS.ppp.awardSummary)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.ppp.awardsGrid)).toBeVisible();
    await expect(page.locator('[data-testid^="ppp-award-card-"]').first()).toBeVisible();

    await page.getByTestId(TEST_IDS.ppp.category('gpu')).click();
    await expect(page.locator('[data-testid^="ppp-award-badge-"]').first()).toBeVisible();

    await page.locator('[data-testid^="ppp-award-add-cart-"]').first().click();
    await expect(page.getByTestId(TEST_IDS.header.cartCount)).toHaveText('1');
  });
});
