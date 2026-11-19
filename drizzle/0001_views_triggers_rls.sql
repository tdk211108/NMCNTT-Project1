CREATE FUNCTION "public"."forbid_series_kind_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kind IS DISTINCT FROM OLD.kind THEN
    RAISE EXCEPTION 'gpu_series.kind is immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "gpu_series_kind_immutable" BEFORE UPDATE ON "public"."gpu_series"
  FOR EACH ROW EXECUTE FUNCTION "public"."forbid_series_kind_change"();--> statement-breakpoint
CREATE VIEW "public"."storefront_products_v" WITH (security_invoker = true) AS
WITH rows AS (
  SELECT p.id, p.category, p.name, p.price_vnd, p.image_url, p.updated_at,
         c.vendor::text AS vendor, NULL::text AS aib_brand, NULL::text AS series_id,
         c.socket, NULL::smallint AS vram_gb, c.passmark_raw
  FROM "public"."products" p
  JOIN "public"."cpu_specs" c ON c.product_id = p.id
  WHERE p.deleted_at IS NULL
  UNION ALL
  SELECT p.id, p.category, p.name, p.price_vnd, p.image_url, p.updated_at,
         s.vendor::text AS vendor, v.aib_brand, s.id AS series_id,
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
FROM rows r;--> statement-breakpoint
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."cpu_specs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."gpu_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."gpu_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."legacy_cpus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."order_status_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."auth_failures" ENABLE ROW LEVEL SECURITY;
