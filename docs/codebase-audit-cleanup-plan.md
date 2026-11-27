# CoreRaster Codebase Audit & Minimal Cleanup Plan (Post-ac82b5f)

**Status:** Completed (Phases 1–4 verified; `typecheck`, `lint`, `test:coverage` 33/33 files & 147/147 tests + 100% domain coverage, and `next build` all passed)

**Baseline:** Follow-up to the previous audit cleanup commit `ac82b5f` (`refactor,chore: audit cleanup, modularize features/services and move seed assets to data/seed`), covering the full codebase with deep focus on the 84 modified files and ~30 new files added afterward (Email + OTP auth, Facebook email verification, forgot/change password, Resend order emails, `/profile`, order cancellation `drizzle/0006`, mobile nav/filter drawers & bottom bar, `PasswordInput`, and `PriceInput`).

**Assumed Load:** Low-to-moderate concurrent demo/portfolio traffic (tens of concurrent users across Vercel Node.js serverless functions sharing Supabase PostgreSQL).

**Baseline Static Checks Observed:**
- `npm run typecheck` (`tsc --noEmit`): passes (0 errors)
- `npm run lint` (`eslint .`): passes (0 errors/warnings)

**Estimated Lean Impact:** Roughly `-260 to -340` net lines of code, `-3` orphaned/stray files, `0` new dependencies, and `6` concrete bugs, race conditions, or stale-cache defects resolved with zero unintended behavior regressions.

---

## 1. Must Fix — Broken Assumptions, Bugs & Races

### 1. `MobileNavDrawer` renders `@null` for Google & Facebook OAuth users
- **Evidence:**
  - `src/features/layout/components/MobileNavDrawer.tsx:297-299` renders `{isAdmin ? VI_MESSAGES.nav.adminMode : `@${authState.user.username}`}`.
  - In `src/shared/types/auth.ts:7`, `SessionUser.username` is `string | null` — always `null` for Google and Facebook OAuth users.
  - Contrast with `src/features/profile/components/ProfileView.tsx:129-131`, which guards `profile.username ? `@${profile.username}` : VI_MESSAGES.profile.oauthUsernameFallback`.
- **Smallest Fix:** Replace line 298 in `MobileNavDrawer.tsx` with:
  ```tsx
  {isAdmin
    ? VI_MESSAGES.nav.adminMode
    : authState.user.username
      ? `@${authState.user.username}`
      : VI_MESSAGES.profile.oauthUsernameFallback}
  ```
- **Verification Test:** Add an OAuth user (`username: null`) assertion in `tests/unit/client/layout.test.ts` verifying `MobileNavDrawer` output does not contain `@null`.

### 2. Stale `/profile` cache across order mutations & unhandled `ORDER_CANCELLED` on stage advance
- **Evidence:**
  - `src/features/orders/useCancelOrder.ts:36-37, 51-52` invalidates `['orders', 'mine']` and `['admin', 'orders']`, omitting `['profile']` (added later; `src/features/auth/useAuthSession.ts:97-101` invalidates all three).
  - `src/features/orders/useAdvanceOrderStage.ts:55-64` never invalidates `['orders', 'mine']`, `['profile']`, or `['admin', 'orders']` on success, leaving `/profile` KPIs (`completedOrders`, `completedSpentVnd`, `activeOrders`) stale after an order advances or completes delivery.
  - `src/features/orders/useAdvanceOrderStage.ts:67` handles only `err.code === 'STALE_STAGE'`; it ignores `err.code === 'ORDER_CANCELLED'` even though `src/server/services/order.service.ts:406-411, 441-445` attaches `details: { order: staleBoard }` for `ORDER_CANCELLED`. If an order is cancelled in another tab and the user clicks Advance, the UI stays stuck on a stale stage-0 board until manual reload.
  - `src/features/checkout/usePlaceOrder.ts:54-58` clears cart/attempt on order placement without invalidating `['orders', 'mine']`, `['profile']`, or `['admin', 'orders']`.
- **Smallest Fix:**
  - Extract a 5-line helper `invalidateOrderLists(queryClient)` in `src/features/orders/` (e.g., inside `optimistic-board.ts` or a dedicated `order-cache.ts`) invalidating `['orders', 'mine']`, `['profile']`, and `['admin', 'orders']`, and call it on mutation settlement from `usePlaceOrder`, `useCancelOrder`, and `useAdvanceOrderStage`.
  - In `useAdvanceOrderStage.ts:67`, handle `err.code === 'STALE_STAGE' || err.code === 'ORDER_CANCELLED'` to sync `err.details?.order` into cache + `onBoardUpdated` + `invalidateOrderLists(queryClient)`, returning early only for `STALE_STAGE` so `ORDER_CANCELLED` still displays `showToast(err.message, 'error')`.

### 3. Concurrent wrong-OTP requests race on `attempts` (can bypass `OTP_MAX_ATTEMPTS`)
- **Evidence:**
  - `src/server/auth/otp.ts:183-194` reads `row.attempts` in JavaScript, computes `const nextAttempts = row.attempts + 1`, and writes `.set({ attempts: nextAttempts })`.
  - Parallel wrong-code verification requests can read the same initial `row.attempts` and overwrite each other's write, permitting more than `OTP_MAX_ATTEMPTS` (`5`) guesses before locking the OTP.
- **Smallest Fix:** Replace lines 184–193 in `src/server/auth/otp.ts` with a single atomic SQL increment and conditional consume:
  ```ts
  const [updated] = await params.db
    .update(emailOtps)
    .set({
      attempts: sql`${emailOtps.attempts} + 1`,
      consumedAt: sql`CASE WHEN ${emailOtps.attempts} + 1 >= ${OTP_MAX_ATTEMPTS} THEN ${now} ELSE ${emailOtps.consumedAt} END`,
    })
    .where(and(eq(emailOtps.id, row.id), isNull(emailOtps.consumedAt)))
    .returning({ attempts: emailOtps.attempts });
  ```
  Then branch on `(updated?.attempts ?? OTP_MAX_ATTEMPTS) >= OTP_MAX_ATTEMPTS`. Keeping `isNull(emailOtps.consumedAt)` in the `WHERE` clause ensures `attempts` never exceeds the DB check constraint (`email_otps_attempts_chk`: `attempts BETWEEN 0 AND 10`).

### 4. `OtpCodeField` flashes an inflated countdown after cooldown expires and user clicks Resend
- **Evidence:**
  - `src/features/auth/components/OtpCodeField.tsx:31-47` initializes `nowMs` once on mount and only updates it inside a 1-second `setInterval` while `cooldownUntilMs > Date.now()`.
  - Once the initial cooldown expires and the interval clears, `nowMs` stays frozen at the old timestamp. If the user waits 2 minutes and clicks Resend (`cooldownUntilMs = Date.now() + 60_000`), the first render calculates `Math.ceil((cooldownUntilMs - staleNowMs) / 1000)` (~180s instead of 60s) until the next interval tick fires.
- **Smallest Fix:** Refresh `nowMs` inside the resend `onClick` handler (via `await onResend(); setNowMs(Date.now());`) and schedule an immediate `setTimeout(() => setNowMs(Date.now()), 0)` when `cooldownUntilMs` changes inside `useEffect`.
  - **Pitfall:** Do not call `setNowMs(...)` synchronously in the `useEffect` body, as `eslint-config-next` 16 enforces `react-hooks/set-state-in-effect`.

### 5. `apiFetch` misclassifies caller-supplied `AbortSignal` cancellations as HTTP `408` timeouts
- **Evidence:**
  - `src/lib/api-client.ts:66-81` creates `const signal = init.signal ?? AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS)` and converts both `TimeoutError` and `AbortError` into `new ApiClientError('INTERNAL', 408, VI_MESSAGES.common.requestTimeoutError)`.
  - Any caller supplying its own `init.signal` (e.g., TanStack Query request cancellation) that aborts receives a misleading 408 timeout error instead of the underlying abort error.
- **Smallest Fix:** Update line 77 in `src/lib/api-client.ts` to:
  ```ts
  if (error instanceof Error && (error.name === 'TimeoutError' || (!init.signal && error.name === 'AbortError')))
  ```

### 6. `ShapeGrid` builds settings twice and redraws the full canvas on every render
- **Evidence:**
  - `src/features/layout/components/ShapeGrid.tsx:256-290` constructs the identical `Settings` object twice (lines 256–270 and 274–288) and invokes `useIsomorphicLayoutEffect(() => { ... engineRef.current?.redraw(); })` with **no dependency array**.
  - Whenever any parent state changes, `useIsomorphicLayoutEffect` runs synchronously and triggers `resize()` + full canvas `draw()` unnecessarily.
- **Smallest Fix:** Extract a pure `normalizeShapeGridSettings(...)` helper used for both initial `useRef` and `useIsomorphicLayoutEffect`, and pass the explicit prop dependency array `[cellSize, lineWidth, direction, speed, lineColor, hoverColor, hoverFillColor, fillOpacity, radius, trail, glow, clickCascade, ignoreCascadeSelector]`.

---

## 2. Should Fix — Duplicated Logic & Unnecessary Complexity

### 7. Four copies of native `<dialog>` open/close + backdrop click-outside plumbing
- **Evidence:**
  - `src/components/ui/Modal.tsx:39-48` (`showModal`/`close` effect)
  - `src/components/ui/ProductImage.tsx:75-107` (`showModal`/`close` + `closedBy` fallback with `event.detail === 0` keyboard-activation guard)
  - `src/features/catalog/components/MobileFilterDrawer.tsx:216-243` (same `showModal`/`close` + `closedBy` fallback, missing `event.detail === 0` guard)
  - `src/features/layout/components/MobileBottomNav.tsx:77-109` (same `showModal`/`close` + `closedBy` fallback, missing `event.detail === 0` guard)
- **Smallest Fix:** Add `useNativeDialog(dialogRef, open)` and `isOutsideDialogBackdropClick(event, dialog)` to `src/lib/client-hooks.ts` and reuse across all 4 components (~75 lines removed and consistent keyboard-click protection). Keep `MobileNavDrawer.tsx` separate because it manages horizontal scroll-snap + `IntersectionObserver` swipe-to-close behavior.

### 8. Duplicated 2-step OTP form state, duplicated Enter-submit handler, and dead refs/state in Auth
- **Evidence:**
  - `src/features/auth/components/AuthModal.tsx:37-38` defines `loginFormRef` and `registerFormRef` and never reads `.current`.
  - `src/features/auth/useAuthSession.ts:247-248` exposes `isRegistering`, referenced only once at `AuthModal.tsx:326` (where step 1 sends an OTP and should use `state.isSendingOtp`).
  - Register (`AuthModal.tsx:32-35, 139-150`), Forgot Password (`AuthOtpFlows.tsx:40-56`), and Facebook Email (`AuthOtpFlows.tsx:245-260`) each duplicate `sentEmail`, `code`, `cooldownUntilMs`, `setCooldownUntilMs(Date.now() + res.resendCooldownSeconds * 1000)`, and `showToast(VI_MESSAGES.auth.otpSentToast(res.email), 'info')`.
  - `preventButtonEnterPropagation` (`AuthModal.tsx:124-137`) and `handleFormKeyDown` (`src/features/profile/components/ChangePasswordModal.tsx:45-55`) are identical keydown handlers.
- **Smallest Fix:**
  - Remove `loginFormRef`, `registerFormRef` (`AuthModal.tsx`) and `isRegistering` (`useAuthSession.ts` + `tests/unit/client/auth-modal.test.ts:33`).
  - Extract a ~25-line `useOtpStepState()` hook inside `src/features/auth/` shared by all 3 OTP flows.
  - Share `submitFormOnEnterExcludingButtons(event, isBusy)` in `src/lib/client-hooks.ts` (used by `AuthModal.tsx` and `ChangePasswordModal.tsx`).

### 9. Navigation & policy link catalogs duplicated across 4 layout components
- **Evidence:**
  - Hardware tool links (`compare`, `combo`, `upgrade`, `psu`) are defined independently in `Header.tsx:36-61`, `MobileNavDrawer.tsx:205-230`, and `MobileBottomNav.tsx:23-48` (`MOBILE_TOOL_SHEET_ITEMS` is a verbatim duplicate of `MobileNavDrawer`'s `toolItems`).
  - Policy links (4 routes) are duplicated between `MobileNavDrawer.tsx:45-50` and `Footer.tsx:42-69`.
- **Smallest Fix:** Extract `src/features/layout/nav-items.ts` exporting `HARDWARE_TOOL_LINKS` and `POLICY_LINKS`. Re-export `HARDWARE_TOOL_LINKS as MOBILE_TOOL_SHEET_ITEMS` from `MobileBottomNav.tsx` so `tests/unit/client/layout.test.ts` imports remain green without churn.

### 10. Server Auth/OTP duplication, double rate-limit query & stale multi-provider branch
- **Evidence:**
  - `src/shared/schemas/auth.ts:107-123`: `authRegisterVerifySchema` and `facebookEmailVerifyOtpSchema` are identical; `facebookEmailRequestOtpSchema` and `forgotPasswordRequestOtpSchema` are identical.
  - `src/server/services/auth.service.ts:560` calls `checkRateLimit(db, 'otp_request', ipHash, now)`, then line 586 calls `sendIssuedOtpOrRollback` -> `issueEmailOtp` (`src/server/auth/otp.ts:63`), which executes the exact same `checkRateLimit(db, 'otp_request', ipHash, now)` query a second time in the same request.
  - `src/app/api/auth/oauth/facebook/request-otp/route.ts:13-17` and `src/app/api/auth/oauth/facebook/verify-otp/route.ts:13-17` repeat the same 5-line `FB_PENDING_COOKIE` verification guard.
  - `src/server/services/auth.service.ts:262-349`: `upsertOAuthUser` is now invoked only for Google (`src/app/api/auth/oauth/[provider]/callback/route.ts:87-88` routes Facebook exclusively to `resolveFacebookOAuthLogin` + `verifyFacebookEmailOtp`), yet `upsertOAuthUser` retains `profile.provider === 'google'` branching as though Facebook still used it.
- **Smallest Fix:**
  - Define base `otpEmailRequestSchema` and `otpCodeVerifySchema` in `src/shared/schemas/auth.ts` and alias the existing exported names (zero breaking import changes).
  - Add `skipRateLimitCheck?: boolean` to `issueEmailOtp` / `sendIssuedOtpOrRollback` so `requestPasswordResetOtp` checks `'otp_request'` once instead of twice.
  - Extract `requireFacebookPending(request)` in `src/server/auth/oauth.ts` for the two Facebook OTP route handlers.
  - Clarify/simplify `upsertOAuthUser` for Google-only OAuth while preserving its signature and behavior for `tests/unit/services/auth.test.ts`.

### 11. Order/Profile duplication & double `orders` query in `/api/profile`
- **Evidence:**
  - `src/server/services/profile.service.ts:34-49` queries `orders` twice in parallel for the same `userId`: an unbounded `SELECT` for `computeProfileOrderStats` (lines 39–47) plus `listOrdersForUser` (line 48).
  - `src/server/services/order.service.ts:357-368` and `src/server/services/admin-order.service.ts:28-39` duplicate `stage`, `cancelledAt`, `isCancelled`, `stageLabel` derivation.
  - `src/server/services/order.service.ts:406-445` (`advanceOrderStage`) and `482-516` (`cancelOrder`) repeat the 5-line `loadOrderBoard` + `throw new AppError(code, { details: { order } })` block 5 times.
  - Client views duplicate the status badge variant ternary 4 times (`ProfileView.tsx:41-45`, `MyOrdersView.tsx:113-121` & `174-182`, `AdminOrdersView.tsx:56-64`).
- **Smallest Fix:**
  - In `profile.service.ts`, merge the two `orders` queries into one `SELECT` ordered by `createdAt DESC`, pass all rows into pure `computeProfileOrderStats` (preserving 100% coverage in `src/server/domain/profile-stats.ts`), and map `.slice(0, MY_ORDERS_MAX_ROWS)` with a shared `mapCustomerOrderSummary` helper. (Add a `shortcut:` note if per-user order history ever grows past a few thousand rows to switch to SQL `COUNT`/`SUM` aggregation.)
  - Extract `resolveOrderStatusMeta(row)` and `throwOrderStateConflict(code, orderId, tx)` in `src/server/services/order.service.ts` and reuse `resolveOrderStatusMeta` in `admin-order.service.ts`.
  - Add `orderStatusBadgeVariant(order, activeVariant?)` in `src/components/ui/Card.tsx` next to `vendorBadgeVariant`.

### 12. Dead client-side pagination fallback in `CatalogView` (pre-server-pagination assumption)
- **Evidence:**
  - `src/features/catalog/useCatalogController.ts:264` unconditionally hardcodes `serverPaginated: true`.
  - Yet `src/features/catalog/components/CatalogView.tsx:25-32, 43-46, 282-291, 331-335, 373-377` keeps a custom `Omit<...> & Partial<Pick<...>>` type shim and 3 `isServer ? ... : paginateItems(...)` fallback branches solely because one mock in `tests/unit/client/catalog-and-home.test.ts:90-125` omits `serverPaginated`, `vendorTotals`, and `isFetching`.
  - Note: keep `paginateItems` in `src/lib/pagination.ts` because `src/features/search/components/SearchResultsView.tsx` actively uses it.
- **Smallest Fix:** Delete `serverPaginated` from `useCatalogController.ts`, simplify `CatalogViewProps = ReturnType<typeof useCatalogController>` and remove the 3 client-pagination fallback branches in `CatalogView.tsx`, and add `vendorTotals: { amd: 1 }, isFetching: false` to that test fixture in `tests/unit/client/catalog-and-home.test.ts:90-125`.

### 13. Duplicated Vietnamese number formatting & unused email type re-export
- **Evidence:**
  - `src/server/domain/format.ts:17-24` (`formatViNumber`) is identical to `src/lib/format.ts:62-72` (`formatNumberVi`). `eslint.config.mjs` permits server modules to import from `@/lib/*` (only client imports from `@/server/*` are disallowed).
  - `src/server/email/templates.ts:26-28` defines `formatVndEmail` (`${amount.toLocaleString('vi-VN')} đ`) and line 275 has an unused `export type { SendEmailPayload };`.
- **Smallest Fix:**
  - Re-export `formatNumberVi as formatViNumber` from `src/server/domain/format.ts` (preserving `tests/unit/domain/format.test.ts` and 100% domain coverage without duplicate code).
  - Delete unused `export type { SendEmailPayload };` at `src/server/email/templates.ts:275`, and optionally reuse `formatNumberVi` inside `formatVndEmail` (`${formatNumberVi(amount)} đ`).
  - **Pitfall:** Do **NOT** replace `formatVndEmail` with `formatVnd` from `@/lib/format` because `Intl.NumberFormat` outputs `50.000 ₫` (NBSP + `₫`), whereas `tests/unit/email/resend-and-templates.test.ts:86` explicitly asserts `'50.000 đ'`.

### 14. Duplicated order summary markup in `CheckoutView.tsx` & URL builders in `useComboAdvisorController.ts`
- **Evidence:**
  - `src/features/checkout/components/CheckoutView.tsx:110-146` (mobile collapsible summary) duplicates lines `264-305` (desktop summary aside) for line items, subtotal, and shipping (and omits total inside the expanded mobile card).
  - `src/features/combo/useComboAdvisorController.ts:58-76` builds identical `URLSearchParams` in `buildComboApiUrl` and `buildComboPageUrl`.
- **Smallest Fix:** Extract a local `<CheckoutSummaryBody quote={state.quote} showTotal={...} />` inside `CheckoutView.tsx` and a shared `buildComboQueryString(params)` inside `useComboAdvisorController.ts`.

---

## 3. Cleanup — Orphaned Assets, Dead Identifiers, Reset Parity & Stale Docs

### 15. Orphaned public SVG icons & stray untracked `edited-files.txt`
- **Evidence (verified 0 references across `src/`, `tests/`, `scripts/`):**
  - `public/icons/facebook.svg` — superseded by `public/fb.svg` (`src/features/layout/components/ZaloButton.tsx:59`).
  - `public/icons/zalo.svg` — superseded by `public/zalo.svg` (`src/features/layout/components/ZaloButton.tsx:80`).
  - `edited-files.txt` — untracked root checklist that is already out of sync with `git status` (omits `MobileBottomNav.tsx`, `MobileNavDrawer.tsx`, `MobileFilterDrawer.tsx`, `PriceInput.tsx`, `use-media-query.ts`, etc.).
- **Smallest Fix:** Delete all 3 files.

### 16. Dead `TEST_IDS`, `VI_MESSAGES` keys, and unused type field
- **Evidence (verified 0 external references across `src/`, `tests/`, `scripts/`):**
  - `src/shared/testids.ts:44` — `TEST_IDS.auth.headerMyOrders` (superseded by `headerProfile`).
  - `src/shared/messages/vi.ts:76` — `VI_MESSAGES.nav.mobileDrawerHandle`.
  - `src/shared/messages/vi.ts:471` — `VI_MESSAGES.cart.mobileCheckoutSummary`.
  - `src/shared/messages/vi.ts:594` — `VI_MESSAGES.orders.cancelledAtLabel`.
  - `src/shared/messages/vi.ts:735` — `VI_MESSAGES.profile.ordersViewAllTab`.
  - `src/shared/types/auth.ts:24` — `OtpRequestResponse.message?: string`.
- **Smallest Fix:** Delete these 6 unused identifiers/fields.

### 17. Sample-reset table parity & stale documentation assumptions
- **Evidence:**
  - `src/server/db/seed/seed-catalog.ts:28-29`: `TRUNCATE_SAMPLE_TABLES_SQL` truncates ephemeral `auth_failures` during admin sample reset, but omits `email_otps` (added in `drizzle/0007`), leaving stale OTP cooldown rows behind after reset.
  - `docs/technical_solution.md:252, 1053, 1061, 1071`: still documents `public/icons/(zalo.svg, facebook.svg, ...)`, "There is no pagination... caps results at 200", deleted `POST /api/auth/register`, and `/advance` without `/cancel` or `ORDER_CANCELLED`.
  - `docs/PROGRESS.md:7, 94, 113`: line 7 still lists package name `techcore` (now `coreraster`), line 94 claims `FloatingNavBar` has *"không có `SearchBar`"* (`Header.tsx:254` renders `<SearchBar compactTrigger />`), and the changelog omits post-`ac82b5f` additions (Email OTP, Resend emails, `/profile`, order cancel `0006`, mobile drawers/bottom bar).
  - `docs/UI_WIRING.md:29, 32, 43, 53`: omits `/profile`, `MobileNavDrawer`, `MobileBottomNav`, `MobileFilterDrawer`, `PasswordInput`, `PriceInput`, order cancellation, and still cites fixed `5tr–300tr` slider bounds (now dynamic `0..shopMaxPriceVnd`) and `public/icons/zalo.svg`.
  - `README.md:15`: omits Email OTP auth, `/profile`, forgot/change password, and order cancellation.
  - **Note on `/orders` vs `/profile` post-login redirect (no silent change):** `usePlacedOrderPopup.ts:91` and `useOrderLookupController.ts:39` route to `/orders`, whereas `Header`, `MobileNavDrawer`, and `MobileBottomNav` route customers to `/profile`. Keep `/orders` intact unless you explicitly want to consolidate `/orders` into `/profile?tab=orders`.
- **Smallest Fix:**
  - Add `email_otps` to `TRUNCATE_SAMPLE_TABLES_SQL` in `src/server/db/seed/seed-catalog.ts:29` and verify `tests/unit/services/admin-reset.test.ts`.
  - Sync the stale sections of `README.md`, `docs/technical_solution.md`, `docs/PROGRESS.md`, and `docs/UI_WIRING.md` in one pass.

---

## 4. Phased Execution Order & Guardrails

Items are grouped into 4 independent phases so all or individual items (e.g., `"fix Phase 1"` or `"fix 1, 2, 3, 4"`) can be executed cleanly:

1. **Phase 1 — Correctness & Performance (Items 1–6):** Highest value, smallest diff (~60 lines touched).
2. **Phase 2 — Server & Shared Dedup (Items 10, 11, 13, 17a):** Pure internal simplification; preserves all API contracts and 100% `src/server/domain/**` coverage.
3. **Phase 3 — Client Hook & UI Dedup (Items 7, 8, 9, 12, 14):** Removes ~220 lines of duplicated UI/dialog/OTP/nav/catalog code.
4. **Phase 4 — Dead Code, Assets & Docs Sync (Items 15, 16, 17b):** Pure deletion + documentation alignment.

### Pitfalls & Guardrails Checklist
- **100% Domain Coverage:** `vitest.config.ts:17-23` enforces **100% lines, branches, functions, and statements** across `src/server/domain/**/*.ts`.
- **ESLint Layer & HTML Rules (`eslint.config.mjs`):**
  - Client files (`src/features/**`, `src/components/**`, `src/lib/**`, `src/shared/**`, `src/app/**/page.tsx`, `layout.tsx`) must never import from `src/server/*` or `next/image`.
  - Customer-facing UI (`src/features/**` excluding `admin`, and `src/app/policies/**`) must never render `<ul>` or `<ol>`.
  - `eslint-config-next` 16 enforces `react-hooks/set-state-in-effect` (avoid synchronous `setState` directly inside `useEffect`).
- **Vietnamese Copy Rules (`tests/unit/text-rules.test.ts`):** Zero em-dashes (`—`) or bullet markers (`•`, `◦`, `-`, `*`) in `VI_MESSAGES`, `ERROR_MESSAGES`, `/policies/**`, `not-found.tsx`, or `error.tsx`.
- **Email VND Assertion (`tests/unit/email/resend-and-templates.test.ts:86`):** Explicitly expects `'50.000 đ'` (do not replace with `formatVnd`, which formats `₫`).
- **Layout Unit Test Contracts (`tests/unit/client/layout.test.ts:286-308`):** Tests `MobileNavDrawer` rendered with `open: false` and imports `MOBILE_TOOL_SHEET_ITEMS` from `MobileBottomNav.tsx`.

### Verification Commands (Run After Implementation)
```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

---

## 5. Not Checked
- **Runtime Test & DB Execution:** `npm run test:coverage` (including Docker Postgres 16 integration tests) and Playwright E2E (`tests/e2e`, `npm run e2e`) were not executed during this static audit.
- **Live Infrastructure:** Production Supabase migration status (`0006`, `0007`), RLS state, Resend DNS/domain verification, and Google/Facebook OAuth provider console settings were not inspected.
- **Visual/Shader Internals:** `src/features/layout/gooey-nav-engine.ts`, `src/features/layout/gooey-nav-shaders.ts`, and `src/features/home/components/FocusPullCarousel.tsx` were intentionally excluded from refactor scope to avoid visual or animation regressions.
