ALTER TYPE "public"."audit_action" ADD VALUE 'impersonation';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "impersonate" integer;