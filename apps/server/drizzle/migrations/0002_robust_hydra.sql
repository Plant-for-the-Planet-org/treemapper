CREATE TYPE "public"."review_comment_author_role" AS ENUM('admin', 'reviewer', 'field_worker');--> statement-breakpoint
CREATE TYPE "public"."review_comment_type" AS ENUM('general', 'issue', 'question', 'response', 'resolution', 'system');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'changes_requested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('draft', 'pending', 'in_review', 'changes_requested', 'in_revision', 'resubmitted', 'approved', 'published', 'unpublished', 'rejected');--> statement-breakpoint
CREATE TABLE "review_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"thread_id" integer NOT NULL,
	"parent_comment_id" integer,
	"author_id" integer NOT NULL,
	"author_role" "review_comment_author_role" NOT NULL,
	"type" "review_comment_type" DEFAULT 'general' NOT NULL,
	"message" text NOT NULL,
	"target_field" text,
	"target_entity_type" text,
	"target_entity_uid" text,
	"severity" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" integer,
	"attachments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "review_comment_uid_unique" UNIQUE("uid"),
	CONSTRAINT "review_comment_valid_severity" CHECK (severity IS NULL OR severity IN ('error', 'warning', 'suggestion')),
	CONSTRAINT "review_comment_valid_target_entity_type" CHECK (target_entity_type IS NULL OR target_entity_type IN ('intervention', 'tree', 'image')),
	CONSTRAINT "review_comment_issue_has_severity" CHECK (type != 'issue' OR severity IS NOT NULL),
	CONSTRAINT "review_comment_resolved_has_details" CHECK (is_resolved = false OR (resolved_by_id IS NOT NULL AND resolved_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "review_thread" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer NOT NULL,
	"thread_number" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" "review_decision",
	"resolved_at" timestamp with time zone,
	"resolved_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_thread_uid_unique" UNIQUE("uid"),
	CONSTRAINT "review_thread_valid_status" CHECK (status IN ('open', 'resolved', 'closed')),
	CONSTRAINT "review_thread_resolved_has_details" CHECK (status != 'resolved' OR (resolution IS NOT NULL AND resolved_by_id IS NOT NULL AND resolved_at IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "review_status" "review_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "first_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "approved_by_id" integer;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "published_by_id" integer;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "unpublished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "unpublished_by_id" integer;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "unpublish_reason" text;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "revision_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "current_review_thread_id" integer;--> statement-breakpoint
ALTER TABLE "tree" ADD COLUMN "review_status" "review_status";--> statement-breakpoint
ALTER TABLE "tree" ADD COLUMN "has_review_issues" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_thread_id_review_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."review_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_thread" ADD CONSTRAINT "review_thread_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_thread" ADD CONSTRAINT "review_thread_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_comment_thread_idx" ON "review_comment" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "review_comment_unresolved_idx" ON "review_comment" USING btree ("thread_id","type","is_resolved") WHERE type = 'issue' AND is_resolved = false AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "review_comment_target_idx" ON "review_comment" USING btree ("target_entity_type","target_entity_uid") WHERE target_entity_uid IS NOT NULL;--> statement-breakpoint
CREATE INDEX "review_thread_intervention_idx" ON "review_thread" USING btree ("intervention_id","thread_number");--> statement-breakpoint
CREATE INDEX "review_thread_open_idx" ON "review_thread" USING btree ("status","created_at") WHERE status = 'open';--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_unpublished_by_id_user_id_fk" FOREIGN KEY ("unpublished_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intervention_review_queue_idx" ON "intervention" USING btree ("review_status","project_id","submitted_at") WHERE review_status IN ('pending', 'resubmitted') AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "intervention_review_status_project_idx" ON "intervention" USING btree ("project_id","review_status","updated_at") WHERE deleted_at IS NULL;