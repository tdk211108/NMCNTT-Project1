# Project TDK Guardrails (CPU & GPU E-Commerce)

Always follow [docs/technical_solution.md](../../docs/technical_solution.md), [docs/idea.md](../../docs/idea.md), and [instruction_to_research.md](../../instruction_to_research.md).

## 1. Architecture & Layer Boundaries
- Every file under `src/server/**` MUST start with `import 'server-only';`.
- `src/features/*` and `src/components/*` MUST NEVER import from `src/server/*`. They may only import `src/shared/*` and `src/lib/*`.
- `src/server/domain/*` holds pure functions only (no DB/network I/O, no `Date.now()` unless injected).
- Client UI never computes prices, shipping fees, normalized scores, performance-per-price rankings, highlights, or PSU wattage. All values come from `/api/*`.
- All `/api/**` Route Handlers (except `/api/address/**`) must export `runtime = 'nodejs'` and `dynamic = 'force-dynamic'`.

## 2. Vietnamese Text & Formatting Rules (Build-Enforced)
- Every customer-facing string lives in `src/shared/messages/vi.ts`; API error messages live in `src/server/http/errors.ts`.
- NEVER use em-dashes (`—`) or bullet markers (`•`, `◦`, `-`, `*`) in customer-facing strings, message catalogs, or `/policies/**` pages.
- NEVER render `<ul>` or `<ol>` in customer-facing components under `src/features/**` (admin pages are exempt). Use prose, tables, spec label rows, or cards.
- Use plain `<img>` (never `next/image`) for product images, with fallback `/icons/placeholder-product.svg`.

## 3. UI & Testing Conventions
- Separate feature hooks (data/mutations/store) from presentational components (props in, JSX out).
- Keep UI usable down to `360px` viewport width.
- Every interactive button, input, select, action link, and modal MUST have a stable `data-testid` matching `<area>-<element>[-<qualifier>]` in `technical_solution.md` §12.3.
- Keep Zalo floating button offset above the sticky comparison bar whenever the bar is visible.

## 4. Database, Security & Seed Rules
- Use `postgres` driver with `prepare: false` for Supavisor transaction pooler (`:6543`); migrations/seed use `DATABASE_URL_MIGRATIONS` (`:5432`).
- Keep RLS enabled with zero policies on all tables. Never expose `ADMIN_PASSWORD`, `AUTH_SECRET`, or `SUPABASE_SECRET_KEY` to `NEXT_PUBLIC_*` or browser bundles.
- Admin `ADMIN_PASSWORD` is stored as `scrypt:<N>:<r>:<p>:<saltB64url>:<hashB64url>` (`:` separator, never `$`).
- Retail and legacy hardware datasets must never overlap: retail GPU variants link only to `gpu_series(kind='retail')`; legacy CPUs stay in `legacy_cpus`.
