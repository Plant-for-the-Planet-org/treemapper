-- The device's most recent error-level activity logs, sent with the device
-- registration on every app open and replaced wholesale each time.
--
-- Deliberately a capped snapshot on the device row, not a log table: there is
-- no history here, nothing to paginate and nothing to prune.
ALTER TABLE "user_device" ADD COLUMN "recent_errors" jsonb;