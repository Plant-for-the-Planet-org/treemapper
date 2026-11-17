-- Per-status breakdown of the unsynced field work on a device, reported with
-- the existing device registration call on every app open.
--
-- Nullable with no default on purpose: null means "this app build never told
-- us", which the dashboard renders as unknown rather than as an empty backlog.
ALTER TABLE "user_device" ADD COLUMN "sync_snapshot" jsonb;