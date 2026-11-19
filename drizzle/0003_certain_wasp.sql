ALTER TABLE "gpu_variants" ADD COLUMN "is_limited_edition" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "public"."gpu_variants"
SET "is_limited_edition" = true
WHERE "product_id" IN (
  'gpu-asus-t1-rtx-5070-12gb-oc',
  'gpu-asus-t1-rtx-5060-ti-8gb-oc',
  'gpu-asus-rog-astral-rtx-5080-16gb-hatsune-miku-oc',
  'gpu-msi-rtx-5090-32gb-lightning-z',
  'gpu-asus-rog-matrix-30th-rtx-5090-32gb',
  'gpu-asus-rog-astral-rtx-5080-16gb-doom-oc',
  'gpu-asus-rog-astral-rtx-5080-dhahab-core-oc',
  'gpu-asus-rog-astral-rtx-5090-dhahab-oc'
);--> statement-breakpoint
DROP VIEW IF EXISTS "public"."storefront_products_v";--> statement-breakpoint
CREATE VIEW "public"."storefront_products_v" WITH (security_invoker = true) AS
WITH rows AS (
  SELECT p.id, p.category, p.name, p.price_vnd, p.image_url, p.updated_at,
         c.vendor::text AS vendor, NULL::text AS aib_brand, NULL::text AS series_id,
         false AS is_limited_edition,
         c.socket, NULL::smallint AS vram_gb, c.passmark_raw
  FROM "public"."products" p
  JOIN "public"."cpu_specs" c ON c.product_id = p.id
  WHERE p.deleted_at IS NULL
  UNION ALL
  SELECT p.id, p.category, p.name, p.price_vnd, p.image_url, p.updated_at,
         s.vendor::text AS vendor, v.aib_brand, s.id AS series_id,
         v.is_limited_edition,
         NULL::text AS socket, s.vram_gb, s.passmark_raw
  FROM "public"."products" p
  JOIN "public"."gpu_variants" v ON v.product_id = p.id
  JOIN "public"."gpu_series" s ON s.id = v.series_id
  WHERE p.deleted_at IS NULL AND s.deleted_at IS NULL
)
SELECT r.*,
       round(100.0 * r.passmark_raw / max(r.passmark_raw) OVER (PARTITION BY r.category), 1)
         AS normalized_score,
       lower(concat_ws(' ', r.name, r.vendor, r.aib_brand, r.socket, r.series_id)) AS search_text
FROM rows r;