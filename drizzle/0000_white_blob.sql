CREATE TYPE "public"."category" AS ENUM('cpu', 'gpu');--> statement-breakpoint
CREATE TYPE "public"."cpu_vendor" AS ENUM('intel', 'amd');--> statement-breakpoint
CREATE TYPE "public"."gpu_series_kind" AS ENUM('retail', 'legacy');--> statement-breakpoint
CREATE TYPE "public"."gpu_vendor" AS ENUM('nvidia', 'amd');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod', 'bank_transfer', 'card');--> statement-breakpoint
CREATE TYPE "public"."auth_scope" AS ENUM('order_lookup', 'admin_login');--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "category" NOT NULL,
	"name" text NOT NULL,
	"price_vnd" bigint NOT NULL,
	"image_url" text,
	"image_storage_path" text,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_id_category_uq" UNIQUE("id","category"),
	CONSTRAINT "products_id_format_chk" CHECK ("products"."id" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("products"."id") <= 80),
	CONSTRAINT "products_name_len_chk" CHECK (char_length("products"."name") BETWEEN 2 AND 150),
	CONSTRAINT "products_price_positive_chk" CHECK ("products"."price_vnd" > 0)
);
--> statement-breakpoint
CREATE TABLE "cpu_specs" (
	"product_id" text PRIMARY KEY NOT NULL,
	"category" "category" DEFAULT 'cpu' NOT NULL,
	"vendor" "cpu_vendor" NOT NULL,
	"architecture" text NOT NULL,
	"socket" text NOT NULL,
	"process_node" text NOT NULL,
	"cores_total" smallint NOT NULL,
	"threads_total" smallint NOT NULL,
	"p_cores" smallint,
	"e_cores" smallint,
	"base_clock_ghz" numeric(4, 2) NOT NULL,
	"boost_clock_ghz" numeric(4, 2) NOT NULL,
	"cache_text" text NOT NULL,
	"l3_cache_mb" numeric(6, 1) NOT NULL,
	"tdp_w" smallint NOT NULL,
	"psu_power_w" smallint NOT NULL,
	"ram_support" text NOT NULL,
	"passmark_raw" integer NOT NULL,
	"passmark_source" text DEFAULT 'PassMark' NOT NULL,
	CONSTRAINT "cpu_specs_category_chk" CHECK ("cpu_specs"."category" = 'cpu'),
	CONSTRAINT "cpu_specs_cores_chk" CHECK ("cpu_specs"."cores_total" > 0),
	CONSTRAINT "cpu_specs_threads_chk" CHECK ("cpu_specs"."threads_total" >= "cpu_specs"."cores_total"),
	CONSTRAINT "cpu_specs_p_cores_chk" CHECK ("cpu_specs"."p_cores" > 0),
	CONSTRAINT "cpu_specs_e_cores_chk" CHECK ("cpu_specs"."e_cores" >= 0),
	CONSTRAINT "cpu_specs_hybrid_cores_chk" CHECK (("cpu_specs"."p_cores" IS NULL AND "cpu_specs"."e_cores" IS NULL) OR ("cpu_specs"."p_cores" + "cpu_specs"."e_cores" = "cpu_specs"."cores_total")),
	CONSTRAINT "cpu_specs_base_clock_chk" CHECK ("cpu_specs"."base_clock_ghz" > 0),
	CONSTRAINT "cpu_specs_boost_clock_chk" CHECK ("cpu_specs"."boost_clock_ghz" >= "cpu_specs"."base_clock_ghz"),
	CONSTRAINT "cpu_specs_l3_cache_chk" CHECK ("cpu_specs"."l3_cache_mb" > 0),
	CONSTRAINT "cpu_specs_tdp_chk" CHECK ("cpu_specs"."tdp_w" > 0),
	CONSTRAINT "cpu_specs_psu_power_chk" CHECK ("cpu_specs"."psu_power_w" >= "cpu_specs"."tdp_w"),
	CONSTRAINT "cpu_specs_passmark_chk" CHECK ("cpu_specs"."passmark_raw" > 0)
);
--> statement-breakpoint
CREATE TABLE "gpu_series" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "gpu_series_kind" NOT NULL,
	"name" text NOT NULL,
	"vendor" "gpu_vendor" NOT NULL,
	"vram_gb" smallint NOT NULL,
	"tbp_w" smallint NOT NULL,
	"cores" integer,
	"base_clock_mhz" integer,
	"boost_clock_mhz" integer,
	"memory_type" text,
	"bus_width_bit" smallint,
	"passmark_raw" integer,
	"passmark_source" text,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "gpu_series_id_kind_uq" UNIQUE("id","kind"),
	CONSTRAINT "gpu_series_id_format_chk" CHECK ("gpu_series"."id" ~ '^[A-Za-z0-9-]{2,60}$'),
	CONSTRAINT "gpu_series_name_len_chk" CHECK (char_length("gpu_series"."name") BETWEEN 2 AND 100),
	CONSTRAINT "gpu_series_vram_chk" CHECK ("gpu_series"."vram_gb" > 0),
	CONSTRAINT "gpu_series_tbp_chk" CHECK ("gpu_series"."tbp_w" > 0),
	CONSTRAINT "gpu_series_cores_chk" CHECK ("gpu_series"."cores" > 0),
	CONSTRAINT "gpu_series_base_clock_chk" CHECK ("gpu_series"."base_clock_mhz" > 0),
	CONSTRAINT "gpu_series_boost_clock_chk" CHECK ("gpu_series"."boost_clock_mhz" > 0),
	CONSTRAINT "gpu_series_bus_width_chk" CHECK ("gpu_series"."bus_width_bit" > 0),
	CONSTRAINT "gpu_series_passmark_chk" CHECK ("gpu_series"."passmark_raw" > 0),
	CONSTRAINT "gpu_series_retail_specs_chk" CHECK ("gpu_series"."kind" = 'legacy' OR ("gpu_series"."cores" IS NOT NULL AND "gpu_series"."base_clock_mhz" IS NOT NULL AND "gpu_series"."boost_clock_mhz" IS NOT NULL AND "gpu_series"."memory_type" IS NOT NULL AND "gpu_series"."bus_width_bit" IS NOT NULL AND "gpu_series"."passmark_raw" IS NOT NULL AND "gpu_series"."passmark_source" IS NOT NULL AND "gpu_series"."boost_clock_mhz" >= "gpu_series"."base_clock_mhz"))
);
--> statement-breakpoint
CREATE TABLE "gpu_variants" (
	"product_id" text PRIMARY KEY NOT NULL,
	"category" "category" DEFAULT 'gpu' NOT NULL,
	"series_id" text NOT NULL,
	"series_kind" "gpu_series_kind" DEFAULT 'retail' NOT NULL,
	"aib_brand" text NOT NULL,
	"length_mm" smallint NOT NULL,
	"slot_thickness" numeric(3, 1) NOT NULL,
	"hdmi_count" smallint NOT NULL,
	"dp_count" smallint NOT NULL,
	CONSTRAINT "gpu_variants_category_chk" CHECK ("gpu_variants"."category" = 'gpu'),
	CONSTRAINT "gpu_variants_series_kind_chk" CHECK ("gpu_variants"."series_kind" = 'retail'),
	CONSTRAINT "gpu_variants_aib_brand_chk" CHECK (char_length("gpu_variants"."aib_brand") BETWEEN 2 AND 40),
	CONSTRAINT "gpu_variants_length_chk" CHECK ("gpu_variants"."length_mm" BETWEEN 100 AND 450),
	CONSTRAINT "gpu_variants_slot_chk" CHECK ("gpu_variants"."slot_thickness" BETWEEN 1 AND 5),
	CONSTRAINT "gpu_variants_hdmi_chk" CHECK ("gpu_variants"."hdmi_count" BETWEEN 0 AND 8),
	CONSTRAINT "gpu_variants_dp_chk" CHECK ("gpu_variants"."dp_count" BETWEEN 0 AND 8)
);
--> statement-breakpoint
CREATE TABLE "legacy_cpus" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vendor" "cpu_vendor" NOT NULL,
	"socket" text,
	"cores_total" smallint,
	"threads_total" smallint,
	"psu_power_w" smallint NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "legacy_cpus_id_format_chk" CHECK ("legacy_cpus"."id" ~ '^C[0-9]{2,4}$'),
	CONSTRAINT "legacy_cpus_name_len_chk" CHECK (char_length("legacy_cpus"."name") BETWEEN 2 AND 100),
	CONSTRAINT "legacy_cpus_cores_chk" CHECK ("legacy_cpus"."cores_total" > 0),
	CONSTRAINT "legacy_cpus_threads_chk" CHECK ("legacy_cpus"."threads_total" > 0),
	CONSTRAINT "legacy_cpus_psu_power_chk" CHECK ("legacy_cpus"."psu_power_w" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_id" text NOT NULL,
	"line_no" smallint NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"category" "category" NOT NULL,
	"unit_price_vnd" bigint NOT NULL,
	"quantity" smallint NOT NULL,
	"line_total_vnd" bigint NOT NULL,
	CONSTRAINT "order_items_pk" PRIMARY KEY("order_id","line_no"),
	CONSTRAINT "order_items_order_product_uq" UNIQUE("order_id","product_id"),
	CONSTRAINT "order_items_line_no_chk" CHECK ("order_items"."line_no" BETWEEN 1 AND 20),
	CONSTRAINT "order_items_unit_price_chk" CHECK ("order_items"."unit_price_vnd" > 0),
	CONSTRAINT "order_items_quantity_chk" CHECK ("order_items"."quantity" BETWEEN 1 AND 100),
	CONSTRAINT "order_items_line_total_chk" CHECK ("order_items"."line_total_vnd" = "order_items"."unit_price_vnd" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "order_status_events" (
	"order_id" text NOT NULL,
	"stage" smallint NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_status_events_pk" PRIMARY KEY("order_id","stage"),
	CONSTRAINT "order_status_events_stage_chk" CHECK ("order_status_events"."stage" BETWEEN 0 AND 4)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"province_code" text NOT NULL,
	"province_name" text NOT NULL,
	"ward_code" text NOT NULL,
	"ward_name" text NOT NULL,
	"street_address" text NOT NULL,
	"note" text,
	"payment_method" "payment_method" NOT NULL,
	"payment_reference" text NOT NULL,
	"total_quantity" integer NOT NULL,
	"subtotal_vnd" bigint NOT NULL,
	"shipping_fee_vnd" bigint NOT NULL,
	"total_vnd" bigint NOT NULL,
	"status_stage" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_id_format_chk" CHECK ("orders"."id" ~ '^PC-[A-HJKMNP-TV-Z0-9]{10}$'),
	CONSTRAINT "orders_phone_format_chk" CHECK ("orders"."phone" ~ '^0(3|5|7|8|9)[0-9]{8}$'),
	CONSTRAINT "orders_total_quantity_chk" CHECK ("orders"."total_quantity" BETWEEN 1 AND 2000),
	CONSTRAINT "orders_subtotal_positive_chk" CHECK ("orders"."subtotal_vnd" > 0),
	CONSTRAINT "orders_shipping_fee_chk" CHECK ("orders"."shipping_fee_vnd" IN (0, 50000)),
	CONSTRAINT "orders_total_sum_chk" CHECK ("orders"."total_vnd" = "orders"."subtotal_vnd" + "orders"."shipping_fee_vnd"),
	CONSTRAINT "orders_status_stage_chk" CHECK ("orders"."status_stage" BETWEEN 0 AND 4)
);
--> statement-breakpoint
CREATE TABLE "auth_failures" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auth_failures_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"scope" "auth_scope" NOT NULL,
	"ip_hash" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cpu_specs" ADD CONSTRAINT "cpu_specs_product_fk" FOREIGN KEY ("product_id","category") REFERENCES "public"."products"("id","category") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gpu_variants" ADD CONSTRAINT "gpu_variants_product_fk" FOREIGN KEY ("product_id","category") REFERENCES "public"."products"("id","category") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gpu_variants" ADD CONSTRAINT "gpu_variants_series_fk" FOREIGN KEY ("series_id","series_kind") REFERENCES "public"."gpu_series"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "products_active_name_uq" ON "products" USING btree (lower("name")) WHERE "products"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "gpu_series_active_name_uq" ON "gpu_series" USING btree (lower("name")) WHERE "gpu_series"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "gpu_variants_series_idx" ON "gpu_variants" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_cpus_active_name_uq" ON "legacy_cpus" USING btree (lower("name")) WHERE "legacy_cpus"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "auth_failures_lookup_idx" ON "auth_failures" USING btree ("scope","ip_hash","occurred_at" DESC NULLS LAST);