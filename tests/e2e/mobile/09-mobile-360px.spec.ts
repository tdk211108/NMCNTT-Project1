import { expect, gotoReady, test } from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Mobile 360px Responsive, Drawers & Layout @smoke', { tag: '@smoke' }, () => {
  test('renders key routes without horizontal overflow at 360px width', async ({ page }) => {
    const routes = [
      '/',
      '/cpu',
      '/gpu',
      `/products/${E2E_SEED_IDS.cpuRyzen9800x3d}`,
      '/compare',
      '/tools/perf-per-price',
      '/tools/psu',
      '/tools/combo',
      '/tools/upgrade',
      '/cart',
      '/orders/lookup',
      '/policies/warranty',
    ];

    for (const route of routes) {
      await gotoReady(page, route);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
    }
  });

  test('navigates via MobileBottomNav, ToolsSheet, MobileNavDrawer, and MobileFilterDrawer', async ({ page }) => {
    await gotoReady(page, '/');

    await expect(page.getByTestId(TEST_IDS.header.mobileBottomNav)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.header.mobileMenuOpen)).toBeVisible();

    await page.getByTestId(TEST_IDS.header.mobileMenuOpen).click();
    await expect(page.getByTestId(TEST_IDS.header.mobileDrawer)).toBeVisible();
    await page.getByTestId(TEST_IDS.header.mobileDrawerClose).click();
    await expect(page.getByTestId(TEST_IDS.header.mobileDrawer)).toBeHidden();
    await expect(page.getByTestId(TEST_IDS.header.mobileDrawer)).not.toHaveAttribute('open', '');

    await page.getByTestId(TEST_IDS.header.mobileBottomNav).getByRole('button', { name: 'Công cụ' }).click();
    await expect(page.getByTestId(TEST_IDS.header.mobileToolsSheet)).toBeVisible();
    await page
      .getByTestId(TEST_IDS.header.mobileToolsSheet)
      .getByRole('link', { name: /So sánh/i })
      .click();
    await expect(page).toHaveURL(/\/compare$/);

    await gotoReady(page, '/cpu');
    await page.getByTestId(TEST_IDS.listing.mobileFilterTrigger).click();
    await expect(page.getByTestId(TEST_IDS.listing.mobileFilterDrawer)).toBeVisible();
    await page.getByTestId(TEST_IDS.listing.filterVendor('amd')).click();
    await page.getByTestId(TEST_IDS.listing.mobileFilterApply).click();
    await expect(page.getByTestId(TEST_IDS.listing.mobileFilterDrawer)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^AMD \(/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^INTEL \(/ })).toHaveCount(0);
  });

  test('shows sticky mobile purchase bars on detail/cart and avoids footer overlap from support dock', async ({ page }) => {
    await gotoReady(page, `/products/${E2E_SEED_IDS.cpuRyzen9800x3d}`);
    await expect(page.getByTestId(TEST_IDS.header.mobileBottomNav)).toHaveCount(0);
    await expect(page.getByTestId(TEST_IDS.detail.mobileStickyBar)).toBeVisible();

    await page.getByTestId(TEST_IDS.detail.addToCart).click();
    await gotoReady(page, '/cart');
    await expect(page.getByTestId(TEST_IDS.header.mobileBottomNav)).toHaveCount(0);
    await expect(page.getByTestId(TEST_IDS.cart.mobileStickyBar)).toBeVisible();

    await gotoReady(page, '/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footerGithub = page.getByTestId(TEST_IDS.layout.footerGithubButton);

    const dockBox = await page.getByTestId(TEST_IDS.layout.supportDock).boundingBox();
    const githubBox = await footerGithub.boundingBox();
    const privacyBox = await page.getByTestId(TEST_IDS.layout.footerLinkPrivacy).boundingBox();

    expect(dockBox).not.toBeNull();
    expect(githubBox).not.toBeNull();
    expect(privacyBox).not.toBeNull();

    if (dockBox && githubBox && privacyBox) {
      const overlaps = (a: typeof dockBox, b: typeof dockBox) =>
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
      expect(overlaps(dockBox, githubBox)).toBe(false);
      expect(overlaps(dockBox, privacyBox), `dock=${JSON.stringify(dockBox)} privacy=${JSON.stringify(privacyBox)}`).toBe(false);
    }
  });
});
