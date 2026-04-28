CREATE TYPE "public"."project_status" AS ENUM('active', 'in_review', 'suspended', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."review_comment_author_role" AS ENUM('admin', 'contributor');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'in_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."site_status" ADD VALUE 'other';--> statement-breakpoint
CREATE TABLE "review_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"thread_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"author_role" "review_comment_author_role" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "review_comment_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "review_thread" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer,
	"site_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_thread_uid_unique" UNIQUE("uid"),
	CONSTRAINT "review_thread_valid_status" CHECK (status IN ('open', 'closed')),
	CONSTRAINT "review_thread_one_entity" CHECK ((intervention_id IS NOT NULL AND site_id IS NULL) OR (site_id IS NOT NULL AND intervention_id IS NULL))
);
--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "review_status" "review_status";--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "approved_by_id" integer;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "rejected_by_id" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status" "project_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "approval_board_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "review_status" "review_status";--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "approved_by_id" integer;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site" ADD COLUMN "rejected_by_id" integer;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "settings" jsonb DEFAULT '{"approvalBoardEnabled":false,"defaultProjectVisibility":"private","allowMemberInvites":false,"requireApprovalForNewProjects":false,"maxProjects":null,"notifications":{"onProjectCreate":false,"onInterventionCreate":false,"interventionProjectWhitelist":[],"onProfileActivity":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_thread_id_review_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."review_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_thread" ADD CONSTRAINT "review_thread_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_thread" ADD CONSTRAINT "review_thread_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_thread" ADD CONSTRAINT "review_thread_closed_by_id_user_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_comment_thread_idx" ON "review_comment" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "review_thread_intervention_idx" ON "review_thread" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "review_thread_site_idx" ON "review_thread" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "review_thread_open_idx" ON "review_thread" USING btree ("status") WHERE status = 'open';--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;