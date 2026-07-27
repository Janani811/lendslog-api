-- Custom SQL migration file, put you code below! --
ALTER TABLE "exp_users" ALTER COLUMN "exp_us_clerk_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_password_hash" text;
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_email_verified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_otp_code_hash" text;
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_otp_purpose" varchar(32);
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_otp_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "exp_users" ADD COLUMN "exp_us_otp_attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "exp_users" SET "exp_us_email_verified" = true WHERE "exp_us_password_hash" IS NULL;
