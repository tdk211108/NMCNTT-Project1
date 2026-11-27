import { expect, gotoReady, selectSearchableOption, test } from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Hardware Tools: PSU, Combo Advisor & Upgrade Advisor @smoke', { tag: '@smoke' }, () => {
  test('estimates PSU wattage for retail + legacy parts and handles URL prefills on /tools/psu', async ({ page }) => {
    await gotoReady(page, '/tools/psu');

    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.psu.cpuSelect,
      searchTestId: TEST_IDS.psu.cpuSearch,
      optionTestId: TEST_IDS.psu.cpuOption(`store:${E2E_SEED_IDS.cpuRyzen9800x3d}`),
      searchText: '9800X3D',
    });

    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.psu.gpuSelect,
      searchTestId: TEST_IDS.psu.gpuSearch,
      optionTestId: TEST_IDS.psu.gpuOption(E2E_SEED_IDS.legacyGpu4090),
      searchText: 'RTX 4090',
    });

    await page.getByTestId(TEST_IDS.psu.calculate).click();
    await expect(page.getByTestId(TEST_IDS.psu.resultExact)).toContainText('W');
    await expect(page.getByTestId(TEST_IDS.psu.resultTier)).toContainText('W');

    await gotoReady(
      page,
      `/tools/psu?cpu=store:${E2E_SEED_IDS.cpuRyzen9800x3d}&gpu=${E2E_SEED_IDS.legacyGpu4090}`,
    );
    await expect(page.getByTestId(TEST_IDS.psu.calculate)).toBeEnabled();
    await page.getByTestId(TEST_IDS.psu.calculate).click();
    await expect(page.getByTestId(TEST_IDS.psu.resultTier)).toContainText('W');

    await gotoReady(page, '/tools/psu?cpu=store:nonexistent-cpu-e2e');
    await expect(page.getByTestId(TEST_IDS.psu.prefillNotice)).toBeVisible();
  });

  test('recommends up to 3 combos, adds both parts to cart, and handles low budget on /tools/combo', async ({ page }) => {
    await gotoReady(page, '/tools/combo');

    await page.getByTestId(TEST_IDS.combo.budgetPreset(30_000_000)).click();
    await page.getByTestId(TEST_IDS.combo.purpose('esport')).click();
    await page.getByTestId(TEST_IDS.combo.submit).click();

    await expect(page.getByTestId(TEST_IDS.combo.card(1))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.combo.psuLink(1))).toHaveAttribute('href', /\/tools\/psu\?/);

    await page.getByTestId(TEST_IDS.combo.addBoth(1)).click();
    await expect(page.getByTestId(TEST_IDS.header.cartCount)).toHaveText('2');

    await page.getByTestId(TEST_IDS.combo.budgetInput).fill('5000000');
    await page.getByTestId(TEST_IDS.combo.submit).click();
    await expect(page.getByTestId(TEST_IDS.combo.minBudgetNotice)).toBeVisible();
  });

  test('advises CPU and GPU upgrades with uplift badges and compatibility links on /tools/upgrade', async ({ page }) => {
    await gotoReady(page, '/tools/upgrade');

    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.upgrade.currentSelect,
      searchTestId: TEST_IDS.upgrade.currentSearch,
      optionTestId: TEST_IDS.upgrade.currentOption(`legacy:${E2E_SEED_IDS.legacyCpuI5}`),
      searchText: '10400F',
    });

    await page.getByTestId(TEST_IDS.upgrade.budgetInput).fill('25000000');
    await page.getByTestId(TEST_IDS.upgrade.submit).click();

    await expect(page.getByTestId(TEST_IDS.upgrade.currentSummary)).toBeVisible();
    await expect(page.locator('[data-testid^="upgrade-card-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="upgrade-uplift-"]').first()).toContainText('%');

    await page.getByTestId(TEST_IDS.upgrade.categoryGpu).click();
    await selectSearchableOption(page, {
      triggerTestId: TEST_IDS.upgrade.currentSelect,
      searchTestId: TEST_IDS.upgrade.currentSearch,
      optionTestId: TEST_IDS.upgrade.currentOption(E2E_SEED_IDS.legacyGpu4060),
      searchText: 'RTX 4060',
    });

    await page.getByTestId(TEST_IDS.upgrade.budgetInput).fill('');
    await page.getByTestId(TEST_IDS.upgrade.submit).click();

    await expect(page.locator('[data-testid^="upgrade-card-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="upgrade-aib-variants-link-"]').first()).toHaveAttribute(
      'href',
      /\/gpu\?series=/,
    );
  });
});
