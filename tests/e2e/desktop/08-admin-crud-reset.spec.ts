import { expect, gotoReady, loginAsAdmin, loginViaModal, test } from '../fixtures';
import { E2E_SEED_IDS } from '../helpers/e2e-constants';
import {
  clearOrdersAndUsers,
  isExternalTarget,
  resetAndSeedE2eDb,
  seedCustomerAccount,
} from '../helpers/e2e-db';
import { TEST_IDS } from '../../../src/shared/testids';

const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

test.describe('Admin Guards, CRUD, Image Upload & Reset Sample Data', () => {
  test.skip(isExternalTarget(), 'Admin CRUD and Reset tests only run against local Docker DB.');

  test.beforeAll(async () => {
    resetAndSeedE2eDb();
    await seedCustomerAccount({
      username: 'normal_e2e_user',
      email: 'normal.e2e@example.com',
      displayName: 'User Thường',
      password: 'UserPass!123',
    });
  });

  test.afterAll(async () => {
    resetAndSeedE2eDb();
    await clearOrdersAndUsers();
  });

  test('enforces admin role guards, performs full CRUD + image upload, and resets sample data', async ({ page }) => {
    await gotoReady(page, '/admin');
    await expect(page.getByText('Vui lòng đăng nhập chế độ Quản trị')).toBeVisible();

    await loginViaModal(page, 'normal_e2e_user', 'UserPass!123');
    await expect(page.getByText('Tài khoản hiện tại không có quyền quản trị')).toBeVisible();

    await page.getByTestId(TEST_IDS.auth.headerLogout).click();
    await expect(page.getByTestId(TEST_IDS.auth.headerLoginButton)).toBeVisible();

    await loginAsAdmin(page);
    await expect(page.getByRole('link', { name: 'Tra cứu đơn hàng' })).toHaveCount(0);

    await expect(page.getByTestId(TEST_IDS.admin.dashboardCardProducts)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.admin.dashboardCardGpuSeries)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.admin.dashboardCardLegacyCpus)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.admin.dashboardCardOrders)).toBeVisible();

    // 1) /admin/products CRUD + image upload validation
    await page.getByTestId(TEST_IDS.admin.dashboardCardProducts).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await page.getByTestId(TEST_IDS.admin.productAdd).click();

    await page.getByLabel('Tải ảnh từ máy (tối đa 4 MB)').check();
    const uploadInput = page.getByTestId(TEST_IDS.admin.imageUpload);
    const [invalidUploadRes] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/api/admin/images')),
      uploadInput.setInputFiles({
        name: 'bad-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('not-a-valid-image-magic-bytes'),
      }),
    ]);
    expect(invalidUploadRes.status()).toBe(400);

    let sawMultipartUpload = false;
    await page.route('**/api/admin/images', async (route) => {
      const contentType = route.request().headers()['content-type'] ?? '';
      if (contentType.includes('multipart/form-data')) {
        sawMultipartUpload = true;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          url: '/icons/placeholder-product.svg',
          storagePath: 'uploads/11111111-1111-4111-8111-111111111111.png',
        }),
      });
    });

    await uploadInput.setInputFiles({
      name: 'valid-e2e.png',
      mimeType: 'image/png',
      buffer: VALID_PNG_BYTES,
    });
    await expect(page.getByAltText('Preview')).toBeVisible();
    expect(sawMultipartUpload).toBe(true);
    await page.unroute('**/api/admin/images');

    const createdCpuName = 'Intel Core E2E Test 999';
    await page.getByLabel('Tên sản phẩm').fill(createdCpuName);
    await page.getByLabel('Giá bán (VND)').fill('12345000');
    await page.getByLabel('Kiến trúc').fill('Arrow Lake-S');
    await page.getByLabel('Socket').fill('LGA1851');
    await page.getByLabel('Tiến trình').fill('TSMC N3B');
    await page.getByLabel('Tổng số nhân').fill('8');
    await page.getByLabel('Tổng số luồng').fill('16');
    await page.getByLabel('Base Clock (GHz)').fill('3.5');
    await page.getByLabel('Boost Clock (GHz)').fill('5.2');
    await page.getByLabel('Cache Text').fill('L3 24 MB');
    await page.getByLabel('L3 Cache (MB)').fill('24');
    await page.getByLabel('Base TDP (W)').fill('65');
    await page.getByLabel('PSU Power (W)').fill('120');
    await page.getByLabel('RAM Support').fill('DDR5-6400');
    await page.getByLabel('PassMark Raw').fill('42000');
    await page.getByLabel('PassMark Source').fill('PassMark');

    await page.getByTestId(TEST_IDS.admin.productSave).click();
    await expect(page.getByTestId(TEST_IDS.admin.productSave)).toHaveCount(0);

    const createdRow = page.getByRole('row', { name: new RegExp(createdCpuName) });
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if ((await createdRow.count()) > 0 && (await createdRow.isVisible())) {
        break;
      }
      const nextBtn = page.getByTestId(TEST_IDS.listing.paginationNext('admin-cpu'));
      if ((await nextBtn.count()) === 0 || (await nextBtn.isDisabled())) {
        break;
      }
      await nextBtn.click();
      await expect(page.getByText(new RegExp(`Trang ${attempt + 2} /`))).toBeVisible();
    }
    await expect(createdRow).toBeVisible();

    await gotoReady(page, '/search?q=E2E+Test+999');
    await expect(page.getByText(createdCpuName)).toBeVisible();

    await gotoReady(page, '/admin/products');
    await expect(page.getByText(/Trang 1 \//)).toBeVisible();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if ((await createdRow.count()) > 0 && (await createdRow.isVisible())) {
        break;
      }
      const nextBtn = page.getByTestId(TEST_IDS.listing.paginationNext('admin-cpu'));
      if ((await nextBtn.count()) === 0 || (await nextBtn.isDisabled())) {
        break;
      }
      await nextBtn.click();
      await expect(page.getByText(new RegExp(`Trang ${attempt + 2} /`))).toBeVisible();
    }
    await expect(createdRow).toBeVisible();
    await createdRow.getByRole('button', { name: 'Sửa' }).click();
    await page.getByLabel('Giá bán (VND)').fill('13456000');
    await page.getByTestId(TEST_IDS.admin.productSave).click();
    await expect(createdRow).toContainText('13.456.000');

    await createdRow.getByRole('button', { name: 'Xóa' }).click();
    await page.getByTestId(TEST_IDS.admin.deleteConfirm).click();
    await expect(createdRow).toHaveCount(0);

    // 2) /admin/gpu-series guard + Legacy GPU series CRUD
    await page.getByTestId(TEST_IDS.admin.navGpuSeries).click();
    await expect(page).toHaveURL(/\/admin\/gpu-series$/);

    await page.getByTestId(TEST_IDS.admin.seriesDelete(E2E_SEED_IDS.retailGpuSeries5090)).click();
    await page.getByTestId(TEST_IDS.admin.deleteConfirm).click();
    await expect(page.getByTestId(TEST_IDS.admin.seriesRow(E2E_SEED_IDS.retailGpuSeries5090))).toBeVisible();

    await page.getByTestId(TEST_IDS.admin.seriesKindTab('legacy')).click();
    await page.getByTestId(TEST_IDS.admin.seriesAdd).click();
    await page.getByLabel('Tên dòng GPU').fill('NVIDIA E2E Legacy 999');
    await page.getByLabel('VRAM (GB)').fill('8');
    await page.getByLabel('TBP (W)').fill('150');
    await page.getByTestId(TEST_IDS.admin.seriesLegacyPassmarkInput).fill('12345');
    await page.getByTestId(TEST_IDS.admin.seriesSave).click();

    const legacyGpuRow = page.getByRole('row', { name: /NVIDIA E2E Legacy 999/ });
    await expect(legacyGpuRow).toBeVisible();
    await legacyGpuRow.getByRole('button', { name: 'Xóa' }).click();
    await page.getByTestId(TEST_IDS.admin.deleteConfirm).click();
    await expect(legacyGpuRow).toHaveCount(0);

    // 3) /admin/legacy-cpus CRUD
    await page.getByTestId(TEST_IDS.admin.navLegacyCpus).click();
    await expect(page).toHaveURL(/\/admin\/legacy-cpus$/);
    await page.getByTestId(TEST_IDS.admin.legacyCpuAdd).click();
    await page.getByLabel('Tên CPU tham khảo').fill('Intel Core E2E Legacy 888');
    await page.getByLabel('PSU Power (W)').fill('95');
    await page.getByLabel('Socket (tùy chọn)').fill('LGA1151');
    await page.getByTestId(TEST_IDS.admin.legacyCpuPassmarkInput).fill('9500');
    await page.getByTestId(TEST_IDS.admin.legacyCpuSave).click();

    const legacyCpuRow = page.getByRole('row', { name: /Intel Core E2E Legacy 888/ });
    await expect(legacyCpuRow).toBeVisible();
    await legacyCpuRow.getByRole('button', { name: 'Xóa' }).click();
    await page.getByTestId(TEST_IDS.admin.deleteConfirm).click();
    await expect(legacyCpuRow).toHaveCount(0);

    // 4) /admin/orders & Reset Sample Data + Logout
    await page.getByTestId(TEST_IDS.admin.navOrders).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);

    await page.getByTestId(TEST_IDS.admin.navDashboard).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByTestId(TEST_IDS.admin.resetButton).click();
    await page.getByTestId(TEST_IDS.admin.resetConfirm).click();
    await expect(page.getByText(/Đã khôi phục \d+ sản phẩm/)).toBeVisible({ timeout: 20_000 });

    await page.getByTestId(TEST_IDS.admin.logout).click();
    await expect(page.getByTestId(TEST_IDS.auth.headerLoginButton)).toBeVisible();
  });
});
