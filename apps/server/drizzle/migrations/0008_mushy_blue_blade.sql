ALTER TABLE "user_device" ADD COLUMN "app_build" integer;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "battery_level" integer;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "storage_used_pct" integer;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "network_type" text;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "pending_interventions" integer;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "pending_trees" integer;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "last_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "valid_battery_level" CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100));--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "valid_storage_used_pct" CHECK (storage_used_pct IS NULL OR (storage_used_pct >= 0 AND storage_used_pct <= 100));--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "valid_network_type" CHECK (network_type IS NULL OR network_type IN ('wifi', 'cellular', 'offline'));--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "valid_pending_interventions" CHECK (pending_interventions IS NULL OR pending_interventions >= 0);--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "valid_pending_trees" CHECK (pending_trees IS NULL OR pending_trees >= 0);--> statement-breakpoint
-- Backfill device_os to the lowercase domain the read side assumes.
-- These rows predate normalizeDeviceOs (users.service.ts), which folds
-- expo-device's 'iOS' / 'iPadOS' / 'Android' to 'ios' / 'android'. The server
-- stats and the FleetView platform filter both compare with ===, so every
-- legacy row currently counts as neither iOS nor Android.
-- Same mapping as the normalizer; anything unrecognised is left alone rather
-- than nulled, so no information is lost here.
UPDATE "user_device"
SET "device_os" = CASE
  WHEN lower("device_os") IN ('ios', 'ipados') THEN 'ios'
  WHEN lower("device_os") = 'android' THEN 'android'
  ELSE "device_os"
END
WHERE "device_os" IS NOT NULL
  AND "device_os" NOT IN ('ios', 'android');
