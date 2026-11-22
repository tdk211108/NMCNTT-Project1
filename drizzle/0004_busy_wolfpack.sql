ALTER TABLE "legacy_cpus" ADD COLUMN "passmark_raw" integer;--> statement-breakpoint
ALTER TABLE "legacy_cpus" ADD COLUMN "passmark_source" text;--> statement-breakpoint
ALTER TABLE "legacy_cpus" ADD CONSTRAINT "legacy_cpus_passmark_chk" CHECK ("legacy_cpus"."passmark_raw" > 0);