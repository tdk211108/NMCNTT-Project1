# TechCore — Tiến độ & Lộ trình triển khai

> File ghi nhớ trạng thái dự án giữa các session. Khi bắt đầu session mới, đọc file này cùng `docs/technical_solution.md`, `docs/idea.md`, và `.agents/rules/AGENTS.md`.

## 1. Thông tin & Quyết định đã chốt

- **Tên repo / `package.json`:** `techcore`
- **Tên cửa hàng (`STORE_NAME`):** `TechCore`
- **Đặc tả & Kiến trúc:** Theo `docs/technical_solution.md` (Next.js 16 App Router, TypeScript 6.0.3, Drizzle ORM + `postgres`, Supabase PostgreSQL + Storage, Tailwind CSS 4, TanStack Query, Zustand 5, Zod 4, Vitest, Playwright).
- **Đã xác nhận sai khác & `[Call]` (`docs/technical_solution.md` §0.2, §16):**
  - `D1`: Địa chỉ giao hàng 2 cấp (34 Tỉnh/Thành phố -> 3.321 Phường/Xã/Đặc khu từ `vietnamese-provinces-database` bản `2026-09-20`) + ô số nhà/tên đường.
  - `D2`: `ADMIN_PASSWORD` lưu dạng hash `scrypt:<N>:<r>:<p>:<saltB64url>:<hashB64url>`.
  - Đã bỏ trường `passmark_recorded_on` / `recordedOn` khỏi `docs/idea.md`, `docs/technical_solution.md`, và `.agents/skills/seed-excel-to-ts/SKILL.md` để khớp 1:1 với `hardware_seed_data.xlsx`.
- **Hạ tầng Supabase của người dùng:** Đã tạo project trên Supabase (region `ap-southeast-1`, bật automatic RLS, tắt tự động expose bảng mới) và đã lưu đủ 4 thông số ở máy cá nhân (`DATABASE_URL` `:6543`, `DATABASE_URL_MIGRATIONS` `:5432`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`), kèm hướng dẫn tạo bucket public `product-images`.
- **Ghi chú tài liệu:** `instruction_to_research.md` không có trong workspace; đối chiếu chuẩn seed dựa trên `docs/technical_solution.md` (§6.2, §13.1), `docs/idea.md` (Appendix A), và `.agents/skills/seed-excel-to-ts/SKILL.md`.

---

## 2. Các bước đã hoàn thành

### Bước 0 — Chuẩn hóa Spec, Kiểm định Seed bán lẻ & Tạo Legacy Template (`DONE`)
- [x] Chốt tên `techcore` / `TechCore`, địa chỉ 2 cấp, `D1`/`D2` và các `[Call]` (§16).
- [x] Bỏ `passmark_recorded_on` / `recordedOn` trong `docs/idea.md`, `docs/technical_solution.md`, và `.agents/skills/seed-excel-to-ts/SKILL.md`.
- [x] Kiểm định `hardware_seed_data.xlsx` (**35** `retail_cpus`, **13** `gpu_series`, **65** `gpu_variants` ban đầu: **0 lỗi, 0 cảnh báo**), sau đó bổ sung 6 biến thể RTX 5080/5090 giới hạn lên **71** `gpu_variants` và **106** ảnh trong `seed-images/` (`100` `.webp`, `3` `.png`, `3` `.jpg`; max `342.8 KB`).
- [x] Tạo `legacy_seed_data.xlsx` gồm 3 sheets (`SAMPLE_GUIDE`, `legacy_cpus` 24 dòng `C01`..`C24`, `legacy_gpus` 33 dòng `G01`..`G33`), để trống các ô `psu_power_w`, `tbp_w`, `source_url` để người dùng điền bổ sung trước Bước 2.

### Bước 1 — Khởi tạo Skeleton & Guardrails (`DONE`)
- [x] Tạo `package.json` (`"name": "techcore"`) pin đúng phiên bản theo `docs/technical_solution.md` §3 (`next@16.4.6`, `react@19.3.1`, `typescript@6.0.3`, `drizzle-orm@0.45.4`, `drizzle-kit@0.31.11`, `postgres@4.1.1`, `@supabase/supabase-js@2.119.0`, `zod@4.6.7`, `tailwindcss@4.3.5`, `vitest@5.1.0`, `@playwright/test@1.65.1`, v.v.) và chạy `npm install`.
- [x] Cấu hình `tsconfig.json` (`@/* -> src/*`), `next.config.ts` (security headers §11.7), `postcss.config.mjs`, `drizzle.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json` (`regions: ["sin1"]`, cron `/api/health`).
- [x] Cấu hình `eslint.config.mjs`: rule `no-restricted-imports` chặn client import `src/server/*` và `next/image`, rule `no-restricted-syntax` cấm `<ul>`/`<ol>` trong `src/features/**` (trừ `admin`) và `src/app/policies/**`.
- [x] Tạo `.env.example` (điền sẵn `NEXT_PUBLIC_ZALO_URL=https://zalo.me/84363267165`, `NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/tdk211108/NMCNTT-Project1`, `STORE_NAME=TechCore`) và `.gitignore`.
- [x] Tạo icon trong `public/icons/` (`zalo.svg`, `github.svg`, `placeholder-product.svg`) và app shell tối thiểu (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`).
- [x] Tạo `src/shared/*`: `constants.ts`, `types/` (`common.ts`, `catalog.ts`, `cart-order.ts`, `tools.ts`, `admin.ts`, `index.ts`), `schemas/` (`catalog.ts`, `checkout.ts`, `admin.ts`, `storage.ts`, `index.ts`), `messages/vi.ts`, `testids.ts` cùng `tests/unit/text-rules.test.ts`.
- [x] Viết và chạy `scripts/vendor-address-data.ts` -> tạo `src/data/vn-admin-units.json` (34 tỉnh/thành, 3.321 phường/xã) và `LICENSES/vietnamese-provinces-database.MIT.txt`.
- [x] Kiểm tra baseline: `npm run typecheck`, `npm run lint` (0 lỗi, 0 cảnh báo), `npm test` (2/2 tests passed), `npm run build` (`next build` thành công).
- [x] Gom tài liệu vào `docs/` (`docs/idea.md`, `docs/technical_solution.md`, `docs/PROGRESS.md`) và cập nhật tham chiếu trong `.agents/rules/AGENTS.md` và `.agents/skills/seed-excel-to-ts/SKILL.md`.
- [x] Init Git local (`git init -b main`), cấu hình `.gitignore` bỏ qua `.env*`, `*.xlsx` và `seed-images/` (chỉ chuẩn bị local, chưa commit/push).

---

## 3. Các bước còn lại

### Bước 2 — Database Schema, Migration & Seed lên Supabase (`DONE`)
> **Điều kiện trước khi chạy `db:migrate` / `db:seed` / `storage:seed`:**
> 1. ~~Người dùng điền xong `psu_power_w` (`C01`..`C24`) và `tbp_w` (`G01`..`G33`) trong `legacy_seed_data.xlsx`.~~ (`DONE`: đủ `24/24` CPU và `33/33` GPU)
> 2. ~~Người dùng tạo `.env` từ `.env.example` (4 biến Supabase đã đúng mẫu).~~ (`DONE`: toàn bộ 13 biến gồm `ADMIN_PASSWORD`, `AUTH_SECRET`, `CRON_SECRET` đã điền giá trị thực trong `.env`.)
> 3. ~~Đảm bảo bucket `product-images` (Public) đã tồn tại trên Supabase Storage.~~ (`DONE`: verified `public: true`)

- [x] Viết `src/server/db/client.ts` (`import 'server-only'`, `prepare: false`, `max: 3`, `idle_timeout: 20`).
- [x] Viết `src/server/db/schema/` (`products.ts`, `cpu.ts`, `gpu.ts`, `legacy.ts`, `orders.ts`, `security.ts`, `index.ts`) và `views.ts` (`storefront_products_v` qua `pgView(...).existing()`).
- [x] Generate Drizzle migration (`drizzle/0000_white_blob.sql`) + custom SQL migration (`drizzle/0001_views_triggers_rls.sql`) cho `storefront_products_v`, trigger `forbid_series_kind_change`, và `ENABLE ROW LEVEL SECURITY` (zero policy) trên toàn bộ bảng.
- [x] Convert `hardware_seed_data.xlsx` -> `src/server/db/seed/data/retail-cpus.ts` (35), `gpu-series.ts` (13), `gpu-variants.ts` (71).
- [x] Convert `legacy_seed_data.xlsx` -> `src/server/db/seed/data/legacy-cpus.ts` (24), `legacy-gpus.ts` (33).
- [x] Viết `src/server/db/seed/seed-catalog.ts` (dùng chung cho CLI seed và `reset.service.ts`).
- [x] Viết `src/server/auth/password.ts` và các script: `scripts/hash-admin-password.ts`, `scripts/seed.ts`, `scripts/upload-seed-images.ts` (kèm unit test `tests/unit/seed-data.test.ts` và `tests/unit/password.test.ts`).
- [x] Chạy `npm run db:migrate`, `npm run storage:seed`, và `npm run db:seed` (kiểm chứng lại 2 lần idempotent + kiểm tra trực tiếp Supavisor `:6543`, `storefront_products_v`, RLS 9/9 bảng, trigger `gpu_series_kind_immutable` và HTTP `200` trên ảnh public).

### Bước 3 — Core Backend (`domain` -> `services` -> `/api/*`) + Unit/Integration Tests (`DONE`)
- [x] Đồng bộ `src/shared/*`: chỉnh `ADMIN_SESSION_COOKIE = 'admin_session'`, `ADMIN_SESSION_TTL_HOURS = 8`, bổ sung `stockStatus: 'in_stock'` vào `ProductDetail`, thêm `productListQuerySchema` + `PATCH` schemas + admin DTOs.
- [x] `src/server/domain/*` (pure functions, không I/O, inject clock/RNG): `phone.ts`, `name.ts`, `cart-rules.ts`, `shipping.ts`, `order-id.ts`, `scoring.ts`, `compare.ts`, `psu.ts`, `masking.ts`, `slug.ts`.
- [x] Cài `@vitest/coverage-v8@5.1.0`, cấu hình `npm run test:coverage` đạt **100%** Stmts/Branch/Funcs/Lines cho toàn bộ `src/server/domain/*` + mở rộng `tests/unit/text-rules.test.ts` quét cả `ERROR_MESSAGES` trong `src/server/http/errors.ts`.
- [x] `src/server/auth/*` (`password.ts`, `admin-session.ts`, `order-token.ts`), `src/server/security/*` (`rate-limit.ts`, `client-ip.ts`, `origin-check.ts`), `src/server/address/address.repo.ts`, `src/server/storage/supabase-storage.ts`, `src/server/payments/demo-bank.ts`, `src/server/http/*` (`errors.ts`, `handler.ts`, `route-helpers.ts`).
- [x] `src/server/services/*`: `catalog`, `search`, `compare`, `perf-per-price`, `psu`, `cart`, `checkout`, `order`, `admin-catalog`, `admin-order`, `image`, `reset`.
- [x] Toàn bộ 30 Route Handlers `src/app/api/**/route.ts` (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'` trừ `/api/address/**`); trang `/search?q=` gọi song song `GET /api/products?category=cpu&q=...` và `category=gpu&q=...` (Phương án B) để giữ `category` bắt buộc trên `GET /api/products`.
- [x] Viết & chạy pass 100% unit/infra/integration tests trên Docker `postgres:16-alpine` local (`techcore-test-db`, port `5433`, helper `tests/helpers/test-db.ts`), kiểm chứng `npm run typecheck`, `npm run lint`, `npm run test:coverage` (**13** files, **67/67** tests), và `npm run build` (**30** API routes).

### Bước 4 — UI Skeleton & Kiến trúc 3 tầng Theme-Ready (`DONE`)
- [x] Tầng Theme & Primitives: cấu hình Dark Neutral semantic tokens (`@theme`) trong `src/app/globals.css`, mở rộng `src/shared/messages/vi.ts` + `src/shared/testids.ts`, dựng `src/lib/*` (`api-client.ts`, `format.ts`, `query-provider.tsx`, `safe-storage.ts`) và `src/components/ui/*` (`Button`, `Input`, `Select`, `Card`, `Feedback`, `Table`, `Modal` `<dialog>`, `Toast`, `toast-store`, `ProductImage` dùng `<img>` thường với fallback `/icons/placeholder-product.svg`).
- [x] Tầng Headless Controller (`use*Controller.ts` xuất `{ state, actions }`) + Presentational Views (`*View.tsx`, props-only, responsive từ `360px`, giữ nguyên `data-testid`) trong `src/features/*` + tài liệu nối dây `docs/UI_WIRING.md` để tùy biến UI sâu ở Bước 5 (trước khi viết E2E và deploy).
- [x] Dựng toàn bộ trang App Router (kèm Server wrapper truyền props hoặc giữ Client logic tách riêng qua `*Client.tsx` trên mọi route để export `metadata` sạch trên Next.js 16), cấu hình `layout.tsx` (`title.template` `%s | TechCore` + `openGraph` gốc + `robots`), `buildPageMetadata` trong `src/lib/metadata.ts` (gắn `noIndex` cho `/cart`, `/checkout*`, `/orders*`, `/search`, `/admin*`), trang `not-found.tsx` & `error.tsx`, đồng bộ Supavisor `max_pipeline: 1` trong `src/server/db/client.ts` + timeout 15s ở `src/lib/api-client.ts`:
  - Layout chung (`AppShell`, `Header`, `SearchBar`, Cart badge, nút Tài khoản/Đăng nhập + `AuthModal`, `Footer`, `ZaloButton` cố định góc dưới phải; bỏ `ComparisonBar`).
  - Storefront: `/` (Hero full-viewport `100dvh`, lướt xuống tới 8 CPU nổi bật 2x4 + 8 GPU nổi bật 2x4 đa hãng/phân khúc qua `/api/products/featured`, kèm nút `Xem tất cả CPU` / `Xem tất cả GPU`), `/cpu`, `/gpu` (có 2 tab `Tất cả GPU` và `Limited Edition` lọc 8 biến thể giới hạn qua cờ `is_limited_edition` + migration `drizzle/0003_certain_wasp.sql`), `/search`, `/products/[id]` (nút `Mua ngay` primary giữ món cũ & chuyển `/cart`, nút ô vuông `Thêm vào giỏ` icon, nút `So sánh` nhảy thẳng sang `/compare?ids=...`; khung ảnh `ProductCard` `aspect-square` và `ProductDetailView` `md:min-h-[420px]` nền `bg-white`).
  - 3 Công cụ: `/compare` (chọn 2–3 cột bằng dropdown có ô tìm kiếm `SearchableSelect` tự lọc khóa cùng loại `cpu`/`gpu`, preview ảnh `80×80` dưới mỗi cột đã chọn + ảnh tiêu đề bảng; chỉ highlight Giá, Điểm benchmark, Nhân/luồng ở CPU và Giá, Điểm benchmark, VRAM, CUDA Cores/Stream Processors, Độ rộng bus ở GPU — bỏ highlight xung nhịp, TDP/TBP và L3 Cache), `/tools/perf-per-price`, `/tools/psu` (dropdown `SearchableSelect` + prefill + nút Thử lại).
  - Cart, Checkout & Order Tracking: `/cart`, `/checkout` (bắt buộc đăng nhập mới đặt hàng), `/checkout/payment`, `/orders` (Đơn hàng của tôi cho tài khoản đã đăng nhập), `/orders/lookup`, `/orders/[orderId]` (5-stage board + `[Demo Control]`).
  - Tài khoản & Xác thực: `AuthModal` thống nhất (Google / Facebook OAuth2 + tab Đăng nhập / Đăng ký; nhập `username = admin` + mật khẩu quản trị để vào chế độ Admin), `auth_session` HTTP-only JWT (`SameSite=Lax`), bảng `users` & `oauth_accounts` + `orders.user_id` (`drizzle/0002_flippant_stellaris.sql`, đã migrate lên Supabase cùng `0003_certain_wasp.sql`).
  - Policies (`/policies/warranty`, `/policies/payment-shipping`, `/policies/contact`, `/policies/privacy` phục vụ minh bạch dữ liệu & hướng dẫn xóa tài khoản OAuth — văn xuôi/bảng, không bullet/em-dash), kèm `Footer` đệm đáy `pb-20` tránh nút `ZaloButton` đè góc phải dưới.
  - Admin (`/admin`, `/admin/products`, `/admin/gpu-series`, `/admin/legacy-cpus`, `/admin/orders`).
- [x] Bổ sung unit test cho `src/lib/*` (`format`, `metadata`, `safe-storage`, `apiFetch` timeout), Zustand cart store (`tests/unit/client/lib-and-stores.test.ts`), `text-rules.test.ts` quét cả `policies/privacy`, `not-found.tsx`, `error.tsx`, và `createDbConnection` Supavisor flags (`tests/unit/infra/infra.test.ts`).

### Bước 5 — Polish UI & Tinh chỉnh Giao diện (`DONE`)
- [x] Chốt & triển khai toàn diện **Light Neo-Aero** & **Dark Aero**: tối ưu `web_lightmode.png` & `web_darkmode.png` (`2752x1536`, ~6.2 MB/ảnh) bằng `sharp` sang `public/images/neo-aero-light.webp` (`82 KB`) & `public/images/neo-aero-dark.webp` (`77 KB`); xây `AeroBackdrop` pre-decode 2 lớp + Adaptive Tint Veil.
- [x] Cài đặt typography **`Plus Jakarta Sans` + `JetBrains Mono`** (`next/font/google`), favicon tạm `src/app/icon.svg`, script chống FOUC & đồng bộ OS (`<meta name="color-scheme" content="light dark">`), và nút chuyển chế độ **`InnerMoon`** (`@theme-toggles/react`) kèm `document.startViewTransition` circular reveal `450ms` (`src/components/ui/ThemeToggle.tsx`, `TEST_IDS.header.themeToggle`).
- [x] Chuyển hệ icon sang **`Solar Bold Duotone`** offline (`@iconify/react/dist/offline` + tập con 28 icon trích từ `@iconify-json/solar` trong `src/components/ui/solar-icons.data.ts`, gỡ `lucide-react`), đồng bộ `@theme` & vật liệu kính Neo-Aero trong `@layer components` (`src/app/globals.css`), và nâng cấp toàn bộ `src/components/ui/*`, `Header`, `Footer`, `ZaloButton`, Storefront, 3 Tools, Cart/Checkout/Orders, Policies, và `/admin/*`.
- [x] Hoàn thiện các hạng mục layout trọng tâm: `Header` 1 hàng gọn trên desktop và an toàn `360px`, Split Hero bằng code trên `HomeView` (gắn `HeroShowcaseRow` dữ liệu thật), `OrderBoardView` dạng progress stepper nối mạch 5 chặng kiểu Shopee (giữ nguyên `order-stage-{0..4}`, `data-active`, `data-reached`, nút `[Demo Control]`), giữ ảnh preview nhỏ ở trên và phóng lớn ảnh ở hàng tiêu chí `/compare` (`192x192`), kèm zoom theo con trỏ khi di chuột trên ảnh lớn ở `/compare` & `/products/[id]` (`ProductImage` `zoomOnHover`).
- [x] Kiểm chứng hoàn tất: `npm run typecheck`, `npm run lint`, `npm test` (17 files, 86/86 tests), `npm run build`, và kiểm tra trình duyệt Playwright thực tế (`1440x900` Light/Dark, hover zoom, `ZaloButton` cố định góc phải dưới, `360px` không tràn ngang, 0 lỗi console/hydration).

### Bước 6 — E2E Tests (Playwright) & Kiểm thử tổng thể (`NEXT`)
- [ ] Chạy `npm run test:coverage` (Vitest domain 100% + service integration trên Docker `postgres:16-alpine` port `5433` + text rules).
- [ ] Chốt môi trường DB cho E2E (Docker Postgres local port `5433` hoặc Supabase dev) và viết/chạy `tests/e2e/*` bằng `data-testid` phủ đủ các luồng trong `docs/technical_solution.md` §15 (desktop và `360px`).
- [ ] Chạy `npm run typecheck`, `npm run lint`, và `npm run build` sạch lỗi trên UI đã chốt.

### Bước 7 — Deploy Vercel & Kiểm thử Production
- [x] Init Git, tạo repo dưới tài khoản GitHub cá nhân (`https://github.com/tdk211108/NMCNTT-Project1.git`), đồng bộ và push mã nguồn lên `origin/main`.
- [ ] Cấu hình Env Vars trên Vercel Hobby, deploy production, kiểm tra `/api/health`, chạy `Reset Sample Data`, và chạy Playwright smoke suite trên URL production.
