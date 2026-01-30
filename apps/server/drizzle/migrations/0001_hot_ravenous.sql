ALTER TABLE "review_comment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "review_thread" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "review_comment" CASCADE;--> statement-breakpoint
DROP TABLE "review_thread" CASCADE;--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_approved_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_published_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_unpublished_by_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "intervention_review_queue_idx";--> statement-breakpoint
DROP INDEX "intervention_review_status_project_idx";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "approval_board_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "review_status";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "submitted_at";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "first_submitted_at";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "approved_at";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "approved_by_id";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "published_by_id";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "unpublished_at";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "unpublished_by_id";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "unpublish_reason";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "revision_count";--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "current_review_thread_id";--> statement-breakpoint
ALTER TABLE "tree" DROP COLUMN "review_status";--> statement-breakpoint
ALTER TABLE "tree" DROP COLUMN "has_review_issues";--> statement-breakpoint
DROP TYPE "public"."review_comment_author_role";--> statement-breakpoint
DROP TYPE "public"."review_comment_type";--> statement-breakpoint
DROP TYPE "public"."review_decision";--> statement-breakpoint
DROP TYPE "public"."review_status";