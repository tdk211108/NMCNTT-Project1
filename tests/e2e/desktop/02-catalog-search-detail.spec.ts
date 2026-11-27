import { expect, gotoReady, selectComboboxOption, test } from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Catalog, Search & Product Detail @smoke', { tag: '@smoke' }, () => {
  test('filters, sorts, paginates, and clears filters on /cpu', async ({ page }) => {
    await gotoReady(page, '/cpu');

    const cards = page.locator('[data-testid^="product-card-"]').filter({ hasNotText: '' });
    await expect(cards.first()).toBeVisible();

    await page.getByTestId(TEST_IDS.listing.filterVendor('amd')).click();
    await expect(page.getByRole('heading', { name: /^AMD \(/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^INTEL \(/ })).toHaveCount(0);

    const firstSocketFilter = page.locator('[data-testid^="filter-socket-"]').first();
    if ((await firstSocketFilter.count()) > 0) {
      await firstSocketFilter.click();
      await expect(cards.first()).toBeVisible();
    }

    await page.getByTestId(TEST_IDS.listing.filterPriceMin).fill('5000000');
    await page.getByTestId(TEST_IDS.listing.filterPriceMax).fill('20000000');

    await selectComboboxOption(page, TEST_IDS.listing.sortSelect, 'Giá tăng dần');

    await page.getByTestId(TEST_IDS.listing.filterClear).click();
    await expect(page.getByRole('heading', { name: /^INTEL \(/ })).toBeVisible();

    const amdPage2 = page.getByTestId(TEST_IDS.listing.paginationPage('amd', 2));
    if ((await amdPage2.count()) > 0) {
      await amdPage2.click();
      await expect(amdPage2).toHaveAttribute('aria-current', 'page');
    }
  });

  test('switches GPU tabs (All vs Limited Edition) and applies VRAM/AIB filters on /gpu', async ({ page }) => {
    await gotoReady(page, '/gpu');

    await expect(page.getByTestId(TEST_IDS.listing.gpuTabAll)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible();

    await page.getByTestId(TEST_IDS.listing.gpuTabLimited).click();
    await expect(page.getByTestId(TEST_IDS.listing.gpuTabLimited)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId(TEST_IDS.listing.productCard(E2E_SEED_IDS.gpuLimited5090))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.listing.productCard(E2E_SEED_IDS.gpuTuf5090))).toHaveCount(0);

    await page.getByTestId(TEST_IDS.listing.gpuTabAll).click();
    await page.getByTestId(TEST_IDS.listing.filterVram(32)).click();
    await page.getByTestId(TEST_IDS.listing.filterAib('ASUS')).click();
    await expect(page.getByTestId(TEST_IDS.listing.productCard(E2E_SEED_IDS.gpuAstral5090))).toBeVisible();

    await page.getByTestId(TEST_IDS.listing.filterClear).click();
  });

  test('shows live search suggestions and supports category tabs + sort on /search', async ({ page }) => {
    await gotoReady(page, '/');

    await page.getByTestId(TEST_IDS.header.searchToggle).click();
    const searchInput = page.getByTestId(TEST_IDS.header.searchInput);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('9800X3D');

    await expect(
      page.getByTestId(TEST_IDS.header.searchSuggestion(E2E_SEED_IDS.cpuRyzen9800x3d)),
    ).toBeVisible();

    await searchInput.fill('RTX 5090');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=RTX/);
    await expect(page.getByTestId(TEST_IDS.search.tabAll)).toBeVisible();
    await page.getByTestId(TEST_IDS.search.tabGpu).click();
    await expect(page.getByTestId(TEST_IDS.search.tabGpu)).toHaveAttribute('aria-selected', 'true');
    await selectComboboxOption(page, TEST_IDS.search.sortSelect, 'Giá giảm dần');
    await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible();
  });

  test('verifies product detail lightbox, tool links, and add-to-cart', async ({ page }) => {
    await gotoReady(page, `/products/${E2E_SEED_IDS.cpuRyzen9800x3d}`);

    await expect(page.locator('main h1')).toContainText('9800X3D');

    await page.getByTestId(TEST_IDS.detail.imageLightboxTrigger).click();
    await expect(page.getByTestId(TEST_IDS.layout.imageLightboxDialog)).toBeVisible();
    await page.getByTestId(TEST_IDS.layout.imageLightboxClose).click();
    await expect(page.getByTestId(TEST_IDS.layout.imageLightboxDialog)).toHaveCount(0);

    await page.getByTestId(TEST_IDS.detail.addToCart).click();
    await expect(page.getByTestId(TEST_IDS.header.cartCount)).toHaveText('1');

    await page.getByTestId(TEST_IDS.detail.compareThis).click();
    await expect(page).toHaveURL(new RegExp(`/compare\\?ids=${E2E_SEED_IDS.cpuRyzen9800x3d}`));

    await gotoReady(page, `/products/${E2E_SEED_IDS.cpuRyzen9800x3d}`);
    await page.getByTestId(TEST_IDS.detail.calcPsu).click();
    await expect(page).toHaveURL(new RegExp(`/tools/psu\\?cpu=store`));

    await gotoReady(page, `/products/${E2E_SEED_IDS.cpuRyzen9800x3d}`);
    await page.getByTestId(TEST_IDS.detail.upgradeAdvisorLink).click();
    await expect(page).toHaveURL(/\/tools\/upgrade\?category=cpu/);
  });
});
