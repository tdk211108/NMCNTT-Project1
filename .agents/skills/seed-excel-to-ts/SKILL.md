---
name: seed-excel-to-ts
description: >-
  Validate hardware_seed_data.xlsx and seed-images/ against instruction_to_research.md
  and technical_solution.md §13, then generate typed seed modules under src/server/db/seed/data/.
  Use when inspecting, cleaning, validating, or converting Excel hardware seed data and product images.
---

# Hardware Seed Data Pipeline (`hardware_seed_data.xlsx` -> `src/server/db/seed/data/`)

Use this skill whenever preparing, validating, or converting seed data from `hardware_seed_data.xlsx` and `seed-images/` into typed TypeScript seed files.

## Source of Truth
- Business & Excel rules: `instruction_to_research.md` (§1–§4)
- DB schema & seed targets: `docs/technical_solution.md` (§6.2, §13.1)
- Legacy reference tables: `docs/idea.md` Appendix A

## Pre-Import Validation Checklist

Run a verification script (Python/Node) on `hardware_seed_data.xlsx` before generating `.ts` seed files and fail on any violation:

1. **ID & Cardinality Rules**
   - Total retail items (`retail_cpus` + `gpu_variants`) <= `180`.
   - Every `id` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and length <= `80`.
   - Every `gpu_variants.series_id` exists in `gpu_series.id` (`kind = 'retail'`).
   - `aib_brand` uses canonical capitalization (`ASUS`, `GIGABYTE`, `MSI`, `ZOTAC`, `Colorful`, `INNO3D`, `Sapphire`).
   - Retail names never collide (case-insensitive) with `legacy_cpus` (`C01`..`C24`) or legacy `gpu_series` (`G01`..`G33`).

2. **String & Numeric Sanity**
   - Reject em-dash (`—`), bullet characters (`•`, `◦`), or leading list dashes in `name`, `cache_text`, `ram_support`, `architecture`.
   - Reject Excel formulas (`=...`), `#N/A`, `#REF!`, formatted prices (no `.` or `đ` in numeric cells).
   - Convert literal string `"null"` (and empty cells) in `p_cores` / `e_cores` to TypeScript `null`.
   - Verify `p_cores` and `e_cores`: either both `null`, or `p_cores + e_cores === cores_total`.
   - Verify `boost_clock_ghz >= base_clock_ghz`, `psu_power_w >= tdp_w`, and `slot_thickness` is a decimal in `[1.0, 5.0]`.

3. **Image Mapping (`seed-images/`)**
   - Confirm `image_file` follows `<id>.<ext>` with `.webp`, `.png`, or `.jpg`.
   - Confirm every referenced file exists in `seed-images/` (or unpacked `seed-images.zip`), size <= `4 MB` (warn if > `500 KB`), and count matches `retail_cpus + gpu_variants`.

## Output Generation Rules

1. Generate typed arrays matching the Drizzle schema in `src/server/db/seed/data/`:
   - `retail-cpus.ts`
   - `gpu-series.ts`
   - `gpu-variants.ts`
   - `legacy-cpus.ts`
   - `legacy-gpus.ts`
2. Preserve exact stable IDs and set `isSeed: true` so `reset.service.ts` and `scripts/seed.ts` share one idempotent source.
3. Keep PassMark/power source URLs as inline comments next to entries when available.
4. Never invent missing specs (`null` / missing required fields must be reported explicitly to the user before DB insert).
