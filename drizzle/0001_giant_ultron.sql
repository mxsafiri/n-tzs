CREATE TYPE "public"."psp_provider" AS ENUM('bank_transfer', 'zenopay');--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "payment_provider" "psp_provider" DEFAULT 'bank_transfer';--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "psp_reference" text;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "psp_channel" text;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "buyer_phone" varchar(32);--> statement-breakpoint
CREATE INDEX "deposit_requests_psp_reference_idx" ON "deposit_requests" USING btree ("psp_reference");