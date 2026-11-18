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

### Bước 2 — Database Schema, Migration & Seed lên Supabase (`NEXT`)
> **Điều kiện trước khi chạy `db:migrate` / `db:seed` / `storage:seed`:**
> 1. Người dùng điền xong `psu_power_w` (`C01`..`C24`) và `tbp_w` (`G01`..`G33`) trong `legacy_seed_data.xlsx`.
> 2. Người dùng tạo `.env` từ `.env.example` (điền 4 biến Supabase + `AUTH_SECRET` + `ADMIN_PASSWORD` hash từ `npm run admin:hash`).
> 3. Đảm bảo bucket `product-images` (Public) đã tồn tại trên Supabase Storage.

- [ ] Viết `src/server/db/client.ts` (`import 'server-only'`, `prepare: false`, `max: 3`, `idle_timeout: 20`).
- [ ] Viết `src/server/db/schema/` (`products.ts`, `cpu.ts`, `gpu.ts`, `legacy.ts`, `orders.ts`, `security.ts`, `index.ts`) và `views.ts` (`storefront_products_v` qua `pgView(...).existing()`).
- [ ] Generate Drizzle migration + custom SQL migration cho `storefront_products_v`, trigger `forbid_series_kind_change`, và `ENABLE ROW LEVEL SECURITY` (zero policy) trên toàn bộ bảng.
- [ ] Convert `hardware_seed_data.xlsx` -> `src/server/db/seed/data/retail-cpus.ts`, `gpu-series.ts`, `gpu-variants.ts`.
- [ ] Convert `legacy_seed_data.xlsx` -> `src/server/db/seed/data/legacy-cpus.ts`, `legacy-gpus.ts`.
- [ ] Viết `src/server/db/seed/seed-catalog.ts` (dùng chung cho CLI seed và `reset.service.ts`).
- [ ] Viết các script: `scripts/hash-admin-password.ts`, `scripts/seed.ts`, `scripts/upload-seed-images.ts`.
- [ ] Chạy `npm run db:migrate`, `npm run storage:seed`, và `npm run db:seed`.

### Bước 3 — Core Backend (`domain` -> `services` -> `/api/*`) + Unit/Integration Tests
- [ ] `src/server/domain/*` (pure functions, không I/O, inject clock nếu cần): `phone.ts`, `name.ts`, `cart-rules.ts`, `shipping.ts`, `order-id.ts`, `scoring.ts`, `compare.ts`, `psu.ts`, `masking.ts`, `slug.ts`.
- [ ] Viết Vitest unit test đạt 100% coverage cho toàn bộ `src/server/domain/*` + test quét rule không `—` / không bullet cho `vi.ts`, `errors.ts`, `/policies/**`.
- [ ] `src/server/auth/*` (`password.ts`, `admin-session.ts`, `order-token.ts`), `src/server/security/*` (`rate-limit.ts`, `client-ip.ts`, `origin-check.ts`), `src/server/address/address.repo.ts`, `src/server/storage/supabase-storage.ts`, `src/server/payments/demo-bank.ts`, `src/server/http/*` (`errors.ts`, `handler.ts`).
- [ ] `src/server/services/*`: `catalog`, `search`, `compare`, `perf-per-price`, `psu`, `cart`, `checkout`, `order`, `admin-catalog`, `admin-order`, `image`, `reset`.
- [ ] Toàn bộ Route Handlers `src/app/api/**/route.ts` (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'` trừ `/api/address/**`).

### Bước 4 — UI Skeleton (đủ `data-testid`, responsive từ `360px`)
- [ ] `src/lib/*` (`api-client.ts`, `format.ts`, `safe-storage.ts`) và `src/components/ui/*`.
- [ ] `src/features/*` (tách riêng hook và presentational component, chỉ import `shared` & `lib`, dùng `<img>` thường với fallback `/icons/placeholder-product.svg`).
- [ ] Dựng các trang App Router:
  - Layout chung (Header, Search suggest, Cart badge, Admin toggle, Footer, Zalo/GitHub floating button offset trên Compare bar).
  - Storefront: `/`, `/cpu`, `/gpu`, `/search`, `/products/[id]`.
  - 3 Công cụ: `/compare`, `/tools/perf-per-price`, `/tools/psu`.
  - Cart, Checkout & Order Tracking: `/cart`, `/checkout`, `/checkout/payment`, `/orders/lookup`, `/orders/[orderId]` (5-stage board + `[Demo Control]`).
  - Policies (`/policies/warranty`, `/policies/payment-shipping`, `/policies/contact` — văn xuôi/bảng, không bullet/em-dash).
  - Admin (`/admin`, `/admin/products`, `/admin/gpu-series`, `/admin/legacy-cpus`, `/admin/orders`).

### Bước 5 — E2E Tests (Playwright) & Kiểm thử tổng thể
- [ ] Chạy `npm test` (Vitest domain + service integration + text rules).
- [ ] Viết và chạy `tests/e2e/*` bằng `data-testid` phủ đủ các luồng trong `docs/technical_solution.md` §15.
- [ ] Chạy `npm run lint` và `npm run build` sạch lỗi.

### Bước 6 — Polish UI & Deploy Vercel
- [ ] Tinh chỉnh giao diện bằng Tailwind (áp dụng các skill `unslop`, `tailwind-design-system`, `web-design-guidelines`) không làm thay đổi logic hay `data-testid`.
- [ ] Init Git, tạo repo dưới tài khoản GitHub cá nhân, push code (chỉ khi người dùng yêu cầu), cấu hình Env Vars trên Vercel Hobby.
- [ ] Deploy production, kiểm tra `/api/health`, chạy `Reset Sample Data`, và chạy Playwright smoke suite trên URL production.
