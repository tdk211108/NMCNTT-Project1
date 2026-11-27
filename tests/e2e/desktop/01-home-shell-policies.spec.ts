import { expect, gotoReady, test } from '../fixtures';
import { E2E_CRON_SECRET } from '../helpers/e2e-constants';
import { isExternalTarget } from '../helpers/e2e-db';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('First-visit Preloader & Demo Notice', () => {
  test.use({
    demoNoticeEnabled: true,
    reducedMotion: 'no-preference',
  });

  test('dismisses preloader, locks demo notice for 5s against Escape, unlocks, and persists seen flag @smoke', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId(TEST_IDS.layout.preloader)).toHaveCount(0, { timeout: 20_000 });

    const dialog = page.getByTestId(TEST_IDS.layout.demoNoticeDialog);
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const closeBtn = page.getByTestId(TEST_IDS.layout.demoNoticeClose);
    await expect(closeBtn).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    await expect(closeBtn).toBeEnabled({ timeout: 8_000 });
    await closeBtn.click();
    await expect(dialog).toHaveCount(0);

    await expect(page.getByTestId(TEST_IDS.home.sliderPlayToggle('cpu'))).toBeVisible();
    await page.getByTestId(TEST_IDS.home.sliderPlayToggle('cpu')).click();

    await gotoReady(page, '/');
    await expect(page.getByTestId(TEST_IDS.layout.demoNoticeDialog)).toHaveCount(0);
  });
});

test.describe('Home, Shell, Health, Policies & 404 @smoke', { tag: '@smoke' }, () => {
  test('verifies /api/health endpoint', async ({ request }) => {
    const publicRes = await request.get('/api/health');
    expect(publicRes.status()).toBe(200);
    expect(await publicRes.json()).toEqual({ ok: true });

    if (!isExternalTarget()) {
      const cronRes = await request.get('/api/health', {
        headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` },
      });
      expect(cronRes.status()).toBe(200);
      expect(await cronRes.json()).toEqual({ ok: true, db: 'up' });
    }
  });

  test('renders home hero, featured carousels, ticker, tools, theme toggle, and support dock', async ({ page }) => {
    await gotoReady(page, '/');

    await expect(page.getByTestId(TEST_IDS.home.heroScrollCta)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.browseCpu)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.browseGpu)).toBeVisible();

    await expect(page.getByTestId(TEST_IDS.home.featuredCpuSection)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.featuredGpuSection)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.toolCompare)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.toolPsu)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.toolCombo)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.home.toolUpgrade)).toBeVisible();

    const tickerTrack = page.locator('.mtx-marquee-track');
    const initialPaused = await tickerTrack.getAttribute('data-paused');
    await page.getByTestId(TEST_IDS.home.tickerToggle).click();
    await expect(tickerTrack).toHaveAttribute('data-paused', initialPaused === 'true' ? 'false' : 'true');

    await page.getByTestId(TEST_IDS.home.sliderNext('cpu')).click();
    await page.getByTestId(TEST_IDS.home.sliderPrev('cpu')).click();

    const themeBtn = page.getByTestId(TEST_IDS.header.themeToggle);
    const initialChecked = await themeBtn.getAttribute('aria-checked');
    await themeBtn.click();
    const toggledChecked = initialChecked === 'true' ? 'false' : 'true';
    await expect(themeBtn).toHaveAttribute('aria-checked', toggledChecked);

    await gotoReady(page, '/');
    await expect(page.getByTestId(TEST_IDS.header.themeToggle)).toHaveAttribute('aria-checked', toggledChecked);
    await page.getByTestId(TEST_IDS.header.themeToggle).click();

    await expect(page.getByTestId(TEST_IDS.layout.zaloFloatButton)).toHaveAttribute('target', '_blank');
    await expect(page.getByTestId(TEST_IDS.layout.facebookFloatButton)).toHaveAttribute('target', '_blank');
    await page.getByTestId(TEST_IDS.layout.supportCollapseToggle).click();
    await expect(page.getByTestId(TEST_IDS.layout.supportExpandButton)).toBeVisible();
    await page.getByTestId(TEST_IDS.layout.supportExpandButton).click();
    await expect(page.getByTestId(TEST_IDS.layout.zaloFloatButton)).toBeVisible();
  });

  test('renders all 4 policy pages without HTML lists and handles 404 route', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.getByTestId(TEST_IDS.layout.footerGithubButton)).toHaveAttribute('target', '_blank');

    const policyRoutes = [
      { testId: TEST_IDS.layout.footerLinkWarranty, path: '/policies/warranty' },
      { testId: TEST_IDS.layout.footerLinkPaymentShipping, path: '/policies/payment-shipping' },
      { testId: TEST_IDS.layout.footerLinkContact, path: '/policies/contact' },
      { testId: TEST_IDS.layout.footerLinkPrivacy, path: '/policies/privacy' },
    ];

    for (const item of policyRoutes) {
      await page.getByTestId(item.testId).click();
      await expect(page).toHaveURL(new RegExp(`${item.path}$`));
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main ul, main ol')).toHaveCount(0);
    }

    await gotoReady(page, '/khong-ton-tai-e2e-route');
    await expect(page.getByTestId(TEST_IDS.errors.notFoundPage)).toBeVisible();
    await page.getByTestId(TEST_IDS.errors.backHomeButton).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
