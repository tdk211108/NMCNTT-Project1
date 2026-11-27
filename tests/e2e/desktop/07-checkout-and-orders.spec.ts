import {
  addProductToCartFromCatalog,
  expect,
  fillCheckoutForm,
  gotoReady,
  loginViaModal,
  test,
} from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import {
  clearAuthFailures,
  clearCapturedEmails,
  clearOrdersAndUsers,
  isExternalTarget,
  resetAndSeedE2eDb,
  seedCustomerAccount,
  waitForCapturedEmail,
} from '../helpers/e2e-db';
import { DEMO_NOTICE_STORAGE_KEY } from '../../../src/shared/constants';
import { TEST_IDS } from '../../../src/shared/testids';

test.describe('Checkout x 3 Methods, Order Board, Cancel & Lookup 429', () => {
  test.skip(isExternalTarget(), 'Mutating checkout and lookup 429 tests require isolated local DB.');

  const buyerUsername = 'e2e_buyer';
  const buyerEmail = 'buyer.e2e@example.com';
  const buyerPassword = 'BuyerPass!123';
  const buyerPhone = '0912345678';

  test.beforeAll(async () => {
    resetAndSeedE2eDb();
    await clearCapturedEmails();
    await seedCustomerAccount({
      username: buyerUsername,
      email: buyerEmail,
      displayName: 'Người Mua E2E',
      password: buyerPassword,
    });
  });

  test.afterAll(async () => {
    await clearAuthFailures();
    await clearOrdersAndUsers();
    await clearCapturedEmails();
  });

  test('enforces checkout auth gate, empty-cart redirect, 3 payment flows, cancel/advance, email alerts, and lookup 429', async ({ browser, page }) => {
    await gotoReady(page, '/checkout');
    await expect(page).toHaveURL(/\/cart\?notice=empty-cart/);
    await expect(page.getByTestId(TEST_IDS.cart.redirectNotice)).toBeVisible();

    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuRyzen7500f);
    await gotoReady(page, '/checkout');
    await expect(page.getByTestId(TEST_IDS.orders.checkoutAuthGate)).toBeVisible();
    await page.getByTestId(TEST_IDS.orders.checkoutAuthLogin).click();

    await loginViaModal(page, buyerUsername, buyerPassword);
    await expect(page.getByTestId(TEST_IDS.checkout.submit)).toBeVisible();

    // 1) COD Checkout + Review Cancel/Edit + Double-click guard + Stage 0 Cancel
    await fillCheckoutForm(page, { phone: buyerPhone, paymentMethod: 'cod', note: 'Ghi chú ban đầu' });
    await page.getByTestId(TEST_IDS.checkout.submit).click();

    await expect(page.getByTestId(TEST_IDS.checkout.reviewModal)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.checkout.reviewCountdown)).toBeVisible();
    await page.getByTestId(TEST_IDS.checkout.reviewCancel).click();
    await expect(page.getByTestId(TEST_IDS.checkout.reviewModal)).toHaveCount(0);

    await page.getByTestId(TEST_IDS.checkout.note).fill('Giao giờ hành chính');
    await page.getByTestId(TEST_IDS.checkout.submit).click();
    await expect(page.getByTestId(TEST_IDS.checkout.reviewModal)).toBeVisible();

    let orderCreateCalls = 0;
    const countOrderRequest = (req: { url: () => string; method: () => string }) => {
      if (req.url().endsWith('/api/orders') && req.method() === 'POST') {
        orderCreateCalls += 1;
      }
    };
    page.on('request', countOrderRequest);
    const confirmNowBtn = page.getByTestId(TEST_IDS.checkout.reviewConfirmNow);
    await confirmNowBtn.dblclick();
    await expect(page.getByTestId(TEST_IDS.orders.placedModal)).toBeVisible({ timeout: 15_000 });
    page.off('request', countOrderRequest);
    expect(orderCreateCalls).toBe(1);

    const orderId1 = (await page.getByTestId(TEST_IDS.orders.idDisplay).innerText()).trim();
    expect(orderId1).toMatch(/^PC-[A-HJKMNP-TV-Z0-9]{10}$/);

    await waitForCapturedEmail(
      (item) => item.to.includes(buyerEmail) && item.text.includes(orderId1),
    );

    await page.getByTestId(TEST_IDS.orders.cancelButton).click();
    await page.getByTestId(TEST_IDS.orders.cancelConfirm).click();
    await expect(page.getByTestId(TEST_IDS.orders.cancelledMessage)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.orders.demoAdvance)).toHaveCount(0);
    await page.getByTestId(TEST_IDS.orders.placedCloseView).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId1}`));

    // 2) VietQR Demo (bank_transfer) + Demo Advance through stages 0..4 + Delivered Email
    await clearCapturedEmails();
    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuRyzen7500f);
    await gotoReady(page, '/checkout');
    await fillCheckoutForm(page, { phone: buyerPhone, paymentMethod: 'bank_transfer' });
    await page.getByTestId(TEST_IDS.checkout.submit).click();
    await page.getByTestId(TEST_IDS.checkout.reviewConfirmNow).click();

    await expect(page).toHaveURL(/\/checkout\/payment$/);
    await expect(page.getByTestId(TEST_IDS.checkout.paymentQrImage)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.checkout.paymentCopyAccount)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.checkout.paymentCopyAmount)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.checkout.paymentCopyMemo)).toBeVisible();
    await page.getByTestId(TEST_IDS.checkout.paymentConfirm).click();

    await expect(page.getByTestId(TEST_IDS.orders.placedModal)).toBeVisible({ timeout: 15_000 });
    const orderId2 = (await page.getByTestId(TEST_IDS.orders.idDisplay).innerText()).trim();
    await page.getByTestId(TEST_IDS.orders.placedCloseView).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId2}`));

    await expect(page.getByTestId(TEST_IDS.orders.stage(0))).toHaveAttribute('data-active', 'true');
    for (let nextStage = 1; nextStage <= 4; nextStage += 1) {
      await page.getByTestId(TEST_IDS.orders.demoAdvance).click();
      await expect(page.getByTestId(TEST_IDS.orders.stage(nextStage))).toHaveAttribute(
        'data-active',
        'true',
      );
      await expect(page.getByTestId(TEST_IDS.orders.stage(nextStage))).toHaveAttribute(
        'data-reached',
        'true',
      );
    }
    await expect(page.getByTestId(TEST_IDS.orders.completedMessage)).toBeVisible();

    await waitForCapturedEmail(
      (item) =>
        item.to.includes(buyerEmail) &&
        item.subject.includes('giao thành công') &&
        item.text.includes(orderId2),
    );

    // 3) Card Demo — Verify card number NEVER leaves browser
    await addProductToCartFromCatalog(page, 'cpu', E2E_SEED_IDS.cpuRyzen7500f);
    await gotoReady(page, '/checkout');
    await fillCheckoutForm(page, { phone: buyerPhone, paymentMethod: 'card' });
    await page.getByTestId(TEST_IDS.checkout.submit).click();
    await page.getByTestId(TEST_IDS.checkout.reviewConfirmNow).click();
    await expect(page).toHaveURL(/\/checkout\/payment$/);

    const fakeCardNumber = '4111222233334444';
    await page.getByTestId(TEST_IDS.checkout.paymentCardNumber).fill(fakeCardNumber);

    const [cardOrderReq] = await Promise.all([
      page.waitForRequest((req) => req.url().endsWith('/api/orders') && req.method() === 'POST'),
      page.getByTestId(TEST_IDS.checkout.paymentConfirm).click(),
    ]);
    expect(cardOrderReq.postData() ?? '').not.toContain(fakeCardNumber);
    await expect(page.getByTestId(TEST_IDS.orders.placedModal)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(TEST_IDS.orders.placedMyOrders).click();

    // 4) /orders & /profile stats/filters
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByTestId(TEST_IDS.orders.myOrdersList)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.orders.myOrdersRow(orderId1))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.orders.myOrdersRow(orderId2))).toBeVisible();

    await gotoReady(page, '/profile');
    await expect(page.getByTestId(TEST_IDS.profile.statsTotalOrders)).toContainText('3');
    await expect(page.getByTestId(TEST_IDS.profile.statsCompletedOrders)).toContainText('1');
    await page.getByTestId(TEST_IDS.profile.tabOrders).click();
    await page.getByTestId(TEST_IDS.profile.orderFilter('cancelled')).click();
    await expect(page.getByTestId(TEST_IDS.profile.orderRow(orderId1))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.profile.orderRow(orderId2))).toHaveCount(0);

    // 5) Anonymous /orders/lookup: happy path masked phone + generic failure + 429 rate limit
    const anonContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    await anonContext.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, '1');
    }, DEMO_NOTICE_STORAGE_KEY);
    const anonPage = await anonContext.newPage();

    try {
      await gotoReady(anonPage, '/orders/lookup');
      await anonPage.getByTestId(TEST_IDS.orders.lookupOrderId).fill(orderId2);
      await anonPage.getByTestId(TEST_IDS.orders.lookupPhone).fill(buyerPhone);
      await anonPage.getByTestId(TEST_IDS.orders.lookupSubmit).click();

      await expect(anonPage).toHaveURL(new RegExp(`/orders/${orderId2}`));
      await expect(anonPage.locator('main')).not.toContainText(buyerPhone);
      await expect(anonPage.locator('main')).toContainText('0912***678');

      await gotoReady(anonPage, '/orders/lookup');
      await anonPage.getByTestId(TEST_IDS.orders.lookupOrderId).fill(orderId2);
      await anonPage.getByTestId(TEST_IDS.orders.lookupPhone).fill('0988888888');
      for (let i = 0; i < 5; i += 1) {
        await expect(anonPage.getByTestId(TEST_IDS.orders.lookupSubmit)).toBeEnabled();
        const [failRes] = await Promise.all([
          anonPage.waitForResponse(
            (res) =>
              res.url().includes('/api/orders/lookup') &&
              res.request().method() === 'POST',
          ),
          anonPage.getByTestId(TEST_IDS.orders.lookupSubmit).click(),
        ]);
        expect(failRes.status()).toBe(404);
        await expect(anonPage.getByTestId(TEST_IDS.orders.lookupError)).toBeVisible();
      }

      await expect(anonPage.getByTestId(TEST_IDS.orders.lookupSubmit)).toBeEnabled();
      const [rateLimitedRes] = await Promise.all([
        anonPage.waitForResponse(
          (res) =>
            res.url().includes('/api/orders/lookup') &&
            res.request().method() === 'POST',
        ),
        anonPage.getByTestId(TEST_IDS.orders.lookupSubmit).click(),
      ]);
      expect(rateLimitedRes.status()).toBe(429);
      await expect(anonPage.getByTestId(TEST_IDS.orders.lookupError)).toBeVisible();
    } finally {
      await anonContext.close();
    }
  });
});
