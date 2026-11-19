# TechCore — Hướng dẫn Tùy biến Giao diện & Nối dây API (Bước 6)

Tài liệu này mô tả cấu trúc 3 tầng của Frontend được xây dựng ở Bước 4 để bạn dễ dàng đổi theme hoặc thiết kế lại hoàn toàn giao diện trước khi deploy mà **không làm gãy logic backend hay bộ test E2E**.

## 1. Mức 1 — Đổi Theme / Màu sắc / Bo góc toàn trang

Toàn bộ màu sắc và bán kính bo góc nằm tại `@theme` trong `src/app/globals.css`:
- Nền & chữ: `--color-bg`, `--color-surface`, `--color-surface-subtle`, `--color-surface-elevated`, `--color-ink`, `--color-ink-muted`
- Viền: `--color-border`, `--color-border-strong`
- Màu chủ đạo & trạng thái: `--color-primary`, `--color-primary-fg`, `--color-accent`, `--color-accent-fg`, `--color-danger`, `--color-danger-fg`, `--color-success`, `--color-success-fg`, `--color-warning`, `--color-warning-fg`, `--color-highlight`, `--color-highlight-fg`
- Nút trình diễn `[Demo Control]`: `--color-demo-bg`, `--color-demo-border`, `--color-demo-fg`
- Hình khối: `--radius-control`, `--radius-card`, `--radius-modal`

## 2. Mức 2 — Đổi Component Hệ thống (`src/components/ui/*`)

- `Button.tsx` (`primary`, `secondary`, `outline`, `ghost`, `danger`, `demo`)
- `Input.tsx`, `Select.tsx`, `SearchableSelect.tsx` (dropdown có ô tìm kiếm nhóm theo danh mục cho `/compare` và `/tools/psu`), `Card.tsx` (`Card`, `Badge`), `Feedback.tsx` (`Spinner`, `EmptyState`), `Icons.tsx` (`CartPlusIcon`)
- `Modal.tsx` (dùng `<dialog>` native `showModal()`, giữ `data-testid`)
- `Table.tsx` (`ResponsiveTableWrapper` cuộn ngang an toàn từ `360px`)
- `Toast.tsx` & `toast-store.ts` (`showToast(message, tone)`)
- `ProductImage.tsx` (dùng `<img>` thường với fallback `/icons/placeholder-product.svg`)

## 3. Mức 3 — Thiết kế lại JSX từng trang mà giữ nguyên dây nối Backend

Mỗi màn hình gồm **Controller Hook** (`{ state, actions }`) + **Presentational View** (`*View.tsx`). Khi viết lại JSX trong `*View.tsx`, chỉ cần giữ các binding `state.*`, `actions.*` và giữ nguyên `data-testid={TEST_IDS...}`:

| Màn hình / Route | Controller Hook (`src/features/...`) | View Component (`*View.tsx`) | Dây nối `{ state, actions }` mới / `TEST_IDS` trọng tâm |
| --- | --- | --- | --- |
| Layout chung | `useSearchSuggest`, `useAuthSession` | `Header`, `Footer`, `ZaloButton`, `AuthModal` | `header.*`, `auth.*`, `layout.*` |
| `/` (Trang chủ) | `useHomeController` | `HomeView`, `ProductCard` | Hero `100dvh`, `cpus` (8), `gpus` (8), `onRetry`, `onBuyNow`, `onAddToCart`, `onCompare` / `home.*` (`heroScrollCta`, `featuredCpuAll`, `featuredGpuAll`, `browseCpu`, `browseGpu`, `tool*`) |
| `/cpu`, `/gpu` | `useCatalogController(category)` | `CatalogView`, `ProductCard` | `limitedOnly`, `onChangeLimitedOnly` (tab `/gpu`: `Tất cả GPU` \| `Limited Edition`), `onBuyNow`, `onAddToCart`, `onCompare` / `listing.*` (`gpuTabAll`, `gpuTabLimited`, `productCardBuyNow`, `productCardAddToCart`, `productCardCompare`) |
| `/search` | `useSearchResultsController(query)` | `SearchResultsView` | `onBuyNow`, `onAddToCart`, `onCompare` / `listing.productCard*` |
| `/products/[id]` | `useProductDetailController(id)` | `ProductDetailView` | `onBuyNow`, `onAddToCart`, `onCompare`, `onCalculatePsu` / `detail.*` (`buyNow`, `addToCart`, `compareThis`, `calcPsu`) |
| `/compare` | `useComparePageController(rawIds)` | `CompareTableView` | `SearchableSelect` từng cột, `state.slots`, `lockedCategory`, `showThirdColumn`, `data`; `onSelectSlot`, `onClearSlot`, `onAddColumn`, `onClearAll`, `onRetryCatalog` / `compare.*` (`slotSelect`, `slotSearch`, `slotOption`, `slotClear`, `addColumn`, `clearAll`, `table`, `cell`, `errorBack`) |
| `/tools/perf-per-price` | `usePerfPerPriceController(...)` | `PerfPerPriceView` | `ppp.*` |
| `/tools/psu` | `usePsuController(...)` | `PsuEstimatorView` | `SearchableSelect` cho CPU/GPU series; `onSelectCpu`, `onSelectGpu`, `onCalculate`, `onRetryOptions` / `psu.*` (`cpuSelect`, `cpuSearch`, `cpuOption`, `gpuSelect`, `gpuSearch`, `gpuOption`, ...) |
| `/cart` | `useCartController(notice)` | `CartView` | `cart.*` |
| `/checkout` | `useCheckoutController()` | `CheckoutView`, `ReviewModal` | `checkout.*`, `orders.checkoutAuthGate`, `orders.checkoutAuthLogin` |
| `/checkout/payment` | `usePaymentController()` | `PaymentView` | `checkout.paymentQrImage`, `paymentCardNumber`, `paymentConfirm`, `orders.checkoutAuthGate` |
| `/orders` & `/orders/lookup` | `useMyOrdersController`, `useOrderLookupController` | `MyOrdersView`, `OrderLookupView` | `orders.myOrders*`, `orders.lookup*` |
| `/orders/[orderId]` | `useOrderBoardController(orderId)` | `OrderBoardView` (Bước 6 vẽ lại `board.stages` thành progress bar Shopee) | `orders.idDisplay`, `stage`, `demoAdvance`, `completedMessage` |
| `/admin/*` | `useAdminDashboardController`, `useAdminProductsController`, `useAdminGpuSeriesController`, `useAdminLegacyCpusController`, `useAdminOrdersController` | `Admin*View` | `admin.*` |

## 4. Quy tắc bắt buộc phải giữ khi sửa UI

1. **Không tự tính tiền, phí ship, điểm chuẩn hóa hay công suất PSU ở client**; luôn đọc trực tiếp từ `state.*`.
2. **Không dùng `<ul>` hoặc `<ol>` trong UI khách hàng** (`src/features/**` trừ `admin`, và `src/app/policies/**`).
3. **Không dùng ký tự `—` (em-dash) hoặc bullet (`•`, `◦`, `-`, `*`)** trong văn bản hiển thị cho khách (`src/shared/messages/vi.ts` và `src/app/policies/**`).
4. **Không import `src/server/*` hoặc `next/image`** trong `src/features/*`, `src/components/*`, `src/lib/*`, `src/app/**/page.tsx`.
5. **Giữ nút `ZaloButton` cố định góc dưới phải (`fixed right-4 bottom-4`)**, đảm bảo không che khuất nút thao tác ở `360px`.
6. **Nút `"Thêm vào giỏ"` dạng ô vuông nhỏ trên `ProductCard` / `ProductDetailView`** luôn phải có `aria-label` phân biệt tên từng sản phẩm và giữ target size tối thiểu `44×44px` (`h-11 w-11` / `h-12 w-12`), bên cạnh nút primary `"Mua ngay"`.
7. **Hero trang chủ & Dropdown có tìm kiếm:** Hero giữ chiều cao tối thiểu toàn màn hình (`min-h-[calc(100dvh-8.5rem)]`) để phần sản phẩm nổi bật (`8 CPU` + `8 GPU`, mỗi nhóm 2 hàng x 4 cột kèm nút `Xem tất cả`) nằm sau khi cuộn xuống; `SearchableSelect` luôn giữ đủ `triggerTestId`, `searchTestId` và `optionTestId`.
