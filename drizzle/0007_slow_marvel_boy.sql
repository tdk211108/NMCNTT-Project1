CREATE TYPE "public"."otp_purpose" AS ENUM('register', 'facebook_verify', 'password_reset');--> statement-breakpoint
ALTER TYPE "public"."auth_scope" ADD VALUE 'otp_request';--> statement-breakpoint
ALTER TYPE "public"."auth_scope" ADD VALUE 'otp_verify';--> statement-breakpoint
ALTER TYPE "public"."auth_scope" ADD VALUE 'password_change';--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"payload_json" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_otps_email_lowercase_chk" CHECK ("email_otps"."email" = lower("email_otps"."email")),
	CONSTRAINT "email_otps_attempts_chk" CHECK ("email_otps"."attempts" BETWEEN 0 AND 10)
);
--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "email_otps_lookup_idx" ON "email_otps" USING btree ("purpose","email","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email") WHERE "users"."email" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_chk" CHECK ("users"."email" IS NULL OR "users"."email" = lower("users"."email"));--> statement-breakpoint
ALTER TABLE "public"."email_otps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
UPDATE "public"."users" u
SET "email_verified_at" = u."created_at"
WHERE u."email" IS NOT NULL
  AND u."email_verified_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "public"."oauth_accounts" oa
    WHERE oa."user_id" = u."id" AND oa."provider" = 'google'
  );