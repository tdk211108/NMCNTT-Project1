# CoreRaster — Hướng dẫn Tùy biến Giao diện & Nối dây API (Bước 5)

Tài liệu này mô tả cấu trúc 3 tầng của Frontend theo định hướng thẩm mỹ **Crimson Matrix 30th Edition** để giữ an toàn toàn bộ logic backend và chuẩn selector E2E cho Bước 6 và Bước 7.

## 1. Mức 1 — Dual-Theme Tokens, Typography & Hình khối (`src/app/globals.css`, `src/app/layout.tsx`, `src/lib/theme.ts`)

Hệ thống sử dụng dual-theme đồng bộ qua `<meta name="color-scheme">` (mặc định **Dark Mode `"Crimson Night"`** `#0E0F12`, chuyển sang **Light Mode `"Urban Daylight"`** `#F2F1ED` qua nút công tắc **CoolThemeToggle** kết hợp hiệu ứng **wave-ripple** của View Transitions API tỏa từ nút bấm và lưu tại `localStorage['coreraster-theme']` cùng `<script>` chống FOUC tại `<head>`):
- Nền & chữ: `--color-bg`, `--color-surface`, `--color-surface-subtle`, `--color-surface-elevated`, `--color-ink`, `--color-ink-muted`
- Viền & bóng cứng (zero-blur): `--color-border`, `--color-border-strong`, `--color-shadow`, `--color-shadow-accent`
- ROG Matrix 30th Crimson & trạng thái: `--color-primary` (`#C8102E`), `--color-primary-hover`, `--color-primary-pressed`, `--color-primary-fg`, `--color-accent`, `--color-accent-ink` (`#FF5C66` Dark / `#B81424` Light đạt WCAG AA 4.5:1+), `--color-signal` (`#FF1E2D`), `--color-danger`, `--color-success`, `--color-warning`, `--color-highlight`, `--color-demo-*`
- Hình khối Neo-Brutalist: `--radius-control: 0px`, `--radius-card: 0px`, `--radius-modal: 0px` cùng các utility `.mtx-chamfer`, `.mtx-hazard-stripe`, `.mtx-crt-scanlines`, `.mtx-blueprint-grid`, `.mtx-shadow`, `.mtx-shadow-accent`
- Typography tiếng Việt 3 cấp (`next/font/google`): `Chakra Petch` (`--font-display`), `JetBrains Mono` (`--font-mono`, kèm `tabular-nums` cho giá/thông số), `Be Vietnam Pro` (`--font-sans`)

## 2. Mức 2 — Component Hệ thống (`src/components/ui/*`)

- `Button.tsx` (`primary`, `secondary`, `outline`, `ghost`, `danger`, `demo` với viền `2px` và nhấn lún cơ học)
- `Input.tsx`, `Select.tsx`, `SearchableSelect.tsx` (dropdown tìm kiếm dùng icon Lucide `ChevronDown`), `Card.tsx` (`Card`, `Badge` có biến thể `nvidia`/`amd`/`intel`/`aib` và helper `vendorBadgeVariant`), `Feedback.tsx` (`Spinner`, `EmptyState`), `Icons.tsx` (`CartPlusIcon` dựng từ Lucide `ShoppingCart` + `Plus`)
- `Modal.tsx` (dùng `<dialog>` native `showModal()`, icon đóng Lucide `X`, giữ `data-testid`)
- `Table.tsx` (`ResponsiveTableWrapper` cuộn ngang an toàn từ `360px`)
- `Toast.tsx` & `toast-store.ts` (`showToast(message, tone)`)
- `ProductImage.tsx` (dùng `<img>` thường nền trắng `bg-white` với fallback `/icons/placeholder-product.svg`; thêm `ZoomableImageFrame` zoom theo con trỏ bằng `transform` qua `ref` cho ảnh lớn không phải ảnh thu nhỏ; `ProductCard` dùng `.product-card-zoom-img`)

## 3. Mức 3 — Thiết kế lại JSX từng trang mà giữ nguyên dây nối Backend

Mỗi màn hình gồm **Controller Hook** (`{ state, actions }`) + **Presentational View** (`*View.tsx`). Khi chỉnh JSX trong `*View.tsx`, luôn giữ các binding `state.*`, `actions.*` và `data-testid={TEST_IDS...}`:

| Màn hình / Route | Controller Hook (`src/features/...`) | View Component (`*View.tsx`) | Dây nối `{ state, actions }` / `TEST_IDS` trọng tâm |
| --- | --- | --- | --- |
| Layout chung | `useSearchSuggest`, `useAuthSession`, `useThemeMode` | `InteractiveBackground` (`ShapeGrid` canvas `z-0` biến thể `#0E0F12`/`#F2F1ED` rơ chuột + click ripple crimson); `Header` gồm bản đầy đủ đứng tĩnh trên đầu trang (`SearchBar`) và thanh thu gọn `floatingNav` bám top không có `SearchBar` khi cuộn trên `md+`; `getChromeContainerClass` dùng `max-w-[1440px]` (`WIDE_CONTAINER_CLASS`) cho đa số trang và mở rộng `max-w-[1760px]` (`CATALOG_CONTAINER_CLASS`) ở `/cpu`, `/gpu`; `ZaloButton` (`56×56px` radar kép `zalo-pulse-ring-delay`) | `header.*` (`floatingNav`, `floatingCartLink`, `floatingCartCount`, `floatingThemeToggle`, `themeToggle`), `auth.*`, `layout.*` (`interactiveBg`) |
| `/` (Trang chủ) | `useHomeController` | `HomeView` (Hero `.hero-dark-stage` + băng rôn ticker `mtx-marquee` full-bleed 100% chiều ngang sát ngay dưới `Header` và vừa khít màn hình đầu `100dvh`; nội dung chữ Hero và các section nổi bật bên dưới nằm trong `WIDE_CONTAINER_CLASS`) | `Hero` full-bleed, `cpus` (5), `gpus` (5), `home.*` |
| `/cpu`, `/gpu` | `useCatalogController(category)` | `CatalogClient`, `CatalogView` (khung `CATALOG_CONTAINER_CLASS` lề gọn giữ khoảng thở quanh sidebar `272–280px` sticky tại `lg:top-[4.75rem]` khớp thanh navigator thu gọn, thanh kéo giá `5tr–300tr`, lưới `lg:grid-cols-3 2xl:grid-cols-4` dùng thẻ `ProductCard variant="catalog"` lớn hơn) | `listing.*` (`gpuTabAll`, `gpuTabLimited`, `filterPriceSliderMin`, `filterPriceSliderMax`, `productCard*`) |
| `/search` | `useSearchResultsController(query)` | `SearchResultsView` | `listing.productCard*` |
| `/products/[id]` | `useProductDetailController(id)` | `ProductDetailView` (`ZoomableImageFrame`) | `detail.*` (`buyNow`, `addToCart`, `compareThis`, `calcPsu`) |
| `/compare` | `useComparePageController(rawIds)` | `CompareTableView` (`80×80` slotPreview tĩnh; ảnh tiêu đề `ZoomableImageFrame`) | `compare.*` (`slotSelect`, `slotPreview`, `table`, `headerImage`, `cell`, ...) |
| `/tools/perf-per-price` | `usePerfPerPriceController(...)` | `PerfPerPriceView` | `ppp.*` |
| `/tools/psu` | `usePsuController(...)` | `PsuEstimatorView` | `psu.*` |
| `/cart` | `useCartController(notice)` | `CartView` (icon Lucide `Minus`/`Plus`/`Trash2`) | `cart.*` |
| `/checkout`, `/checkout/payment` | `useCheckoutController`, `usePaymentController` | `CheckoutView`, `ReviewModal`, `PaymentView` | `checkout.*`, `orders.checkoutAuth*` |
| `/orders` & `/orders/lookup` | `useMyOrdersController`, `useOrderLookupController` | `MyOrdersView`, `OrderLookupView` | `orders.myOrders*`, `orders.lookup*` |
| `/orders/[orderId]` | `useOrderBoardController(orderId)` | `OrderBoardView` (thanh tiến trình Shopee 5 cột mốc icon Lucide đặt trong vòng đệm nền đặc `bg-surface z-10` chống xuyên nét thanh ngang/dọc) | `orders.idDisplay`, `stage`, `demoAdvance`, `completedMessage` |
| Trang tĩnh & Lỗi (`/policies/*`, `not-found.tsx`, `error.tsx`) | `GlobalErrorBoundary` | Server pages + Client boundary | `layout.footerLink*`, `errors.*` |
| `/admin/*` | `useAdmin*Controller` | `Admin*View` | `admin.*` |

## 4. Quy tắc bắt buộc phải giữ khi sửa UI

1. **Không tự tính tiền, phí ship, điểm chuẩn hóa hay công suất PSU ở client**; luôn đọc trực tiếp từ `state.*`.
2. **Không dùng `<ul>` hoặc `<ol>` trong UI khách hàng** (`src/features/**` trừ `admin`, và `src/app/policies/**`).
3. **Không dùng ký tự `—` (em-dash) hoặc bullet (`•`, `◦`, `-`, `*`)** trong văn bản hiển thị cho khách (`src/shared/messages/vi.ts` và `src/app/policies/**`).
4. **Không import `src/server/*` hoặc `next/image`** trong `src/features/*`, `src/components/*`, `src/lib/*`, `src/app/**/page.tsx`.
5. **Mọi UI icon chuẩn đều lấy từ `lucide-react`**; giữ ngoại lệ logo thương hiệu bên thứ 3 (`zalo.svg`, `github.svg`, OAuth Google/Facebook) và màu badge hãng chip (`NVIDIA`/`AMD`/`Intel`).
6. **Giữ nút `ZaloButton` cố định góc dưới phải (`fixed right-4 bottom-4`)**, `Footer` giữ khoảng đệm đáy `pb-20` an toàn từ `360px` tới desktop.
7. **Nút `"Thêm vào giỏ"` dạng ô vuông nhỏ trên `ProductCard` / `ProductDetailView`** sử dụng `AnimatedCartButton` tối thiểu `44×44px` (`h-11 w-11` / `h-12 w-12`), luôn giữ `aria-label` riêng cho từng sản phẩm và phản hồi checkmark động học.
8. **12 component mở rộng đã nối dây (`Header`, `HomeView`, `CatalogView`, `Tools`, `Checkout`, `Admin`):**
   - `MusicPlayerBar` (`header-music-bar`, `header-music-prev`, `header-music-toggle`, `header-music-next`): mini Spotify Card với bìa vuông + đĩa vinyl rãnh sáng trượt xoay + nền blur đặt cạnh nút Giỏ hàng trên Hàng 1 của `Header.tsx`, quét tự động thư mục `public/music/` qua `GET /api/music`.
   - `GooeyNav`: điều hướng chính WebGL2 SDF metaball + hạt giọt particle trên Hàng 2 của `Header.tsx` (dừng gọn sau `Tra cứu đơn hàng`, kèm cả trên `floatingNav`), dựng thuần `role="list"`/`<Link>` không dùng `<ul>`/`<li>`.
   - `SearchBar` (Expandable Search): đặt ở cuối Hàng 2 ngang hàng `GooeyNav`, mặc định thu gọn thành nút icon `header-search-toggle` và mở sang trái 1 khúc (`header-search-input`, `header-search-submit`, hỗ trợ `header-floating-search-toggle` / `header-floating-search-input`).
   - `DecryptedText` & `CoverflowSlider`: chỉ dùng trên `/` (`HomeView.tsx`), gọi `/api/products/featured?preset=landing` hiển thị 5 CPU (`i5-14600K`, `Ryzen 7 9800X3D`, `Core Ultra 7 270K Plus`, `Ryzen 5 7500F`, `Core Ultra 9 285K`) và 5 GPU (`RTX 5060 Ti T1`, `RTX 5090 Dhahab`, `RTX 5090 Matrix 30th Edition`, `RTX 5080 Hatsune Miku Edition`, `RTX 5090 MSI Lightning Z`) với hiệu ứng Coverflow `swiper` (tự chạy chậm, thẻ rút gọn ảnh + tên + giá, chấm pagination + nút `< >`, click card nghiêng hai bên xoay ra giữa trước khi mở chi tiết).
   - `SpectrumLoader`: thay vòng xoay nạp toàn hệ thống trong `Feedback.tsx` với bảng màu ROG Crimson (`#D71920`).
   - `ZoomableImageFrame` (`ProductImage.tsx`): kính lúp tròn bám con trỏ chuột cho ảnh lớn tại `/products/[id]` và cột tiêu đề `/compare` (giữ class `.zoom-frame-cursor`, không phóng ảnh thumbnail).
   - `SearchableSelect` & `ComboboxSelect`: chạy `@base-ui/react` (`Combobox` / `Select`) + `motion` cho `/compare`, `/tools/psu`, và bộ sắp xếp `/cpu`, `/gpu`.
   - `CatalogPagination`: hiển thị phân trang cuối mỗi nhóm hãng tại `/cpu` (tối đa **16** mẫu/trang/hãng) và 1 thanh cuối trang tại `/gpu` (tối đa **40** mẫu/trang), không dùng `<ul>`/`<li>`.
   - `AlertDialog` & `AnimatedCopyButton`: hộp thoại xác nhận `<dialog showModal()>` ở Giỏ hàng + các màn Admin xóa/khôi phục dữ liệu, và nút sao chép mã đơn / thông tin chuyển khoản VietQR (`payment-copy-account`, `payment-copy-amount`, `payment-copy-memo`).
