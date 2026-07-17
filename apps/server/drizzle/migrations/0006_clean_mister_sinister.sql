CREATE TYPE "public"."treematch_event_type" AS ENUM('match', 'unmatch', 'ignore', 'restore', 'block', 'unblock', 'sync_success', 'sync_failure');--> statement-breakpoint
CREATE TYPE "public"."treematch_sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
CREATE TABLE "treematch_allocation" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"contribution_id" integer NOT NULL,
	"intervention_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"units" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "treematch_allocation_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_allocation_units_positive" CHECK (units > 0)
);
--> statement-breakpoint
CREATE TABLE "treematch_contribution" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"ttc_contribution_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"donation_guid" text,
	"donation_ref" text,
	"payment_date" timestamp with time zone,
	"amount" double precision,
	"currency" text,
	"allocation_priority" text,
	"units" integer,
	"units_allocated" integer DEFAULT 0 NOT NULL,
	"ignored" boolean DEFAULT false NOT NULL,
	"ignore_reason" text,
	"ignored_by_id" integer,
	"ignored_at" timestamp with time zone,
	"sync_status" "treematch_sync_status" DEFAULT 'synced' NOT NULL,
	"last_synced_units_allocated" integer,
	"last_synced_at" timestamp with time zone,
	"sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "treematch_contribution_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_contribution_ttc_contribution_id_unique" UNIQUE("ttc_contribution_id"),
	CONSTRAINT "treematch_contribution_units_non_negative" CHECK (units IS NULL OR units >= 0),
	CONSTRAINT "treematch_contribution_allocated_non_negative" CHECK (units_allocated >= 0),
	CONSTRAINT "treematch_contribution_allocated_within_units" CHECK (units IS NULL OR units_allocated <= units),
	CONSTRAINT "treematch_contribution_ignored_has_reason" CHECK (ignored = false OR ignore_reason IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "treematch_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"type" "treematch_event_type" NOT NULL,
	"contribution_id" integer,
	"ttc_contribution_id" integer,
	"intervention_id" integer,
	"units" integer,
	"actor_id" integer,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treematch_event_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "treematch_intervention_block" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"reason" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"released_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "treematch_intervention_block_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "form" DROP CONSTRAINT "form_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "plot_group" DROP CONSTRAINT "plot_group_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_api_key" DROP CONSTRAINT "project_api_key_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_invite" DROP CONSTRAINT "project_invite_invited_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_species" DROP CONSTRAINT "project_species_added_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "review_comment" DROP CONSTRAINT "review_comment_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "site" DROP CONSTRAINT "site_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tree" DROP CONSTRAINT "tree_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tree_record" DROP CONSTRAINT "tree_record_recorded_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "treematch_allocation" ADD CONSTRAINT "treematch_allocation_contribution_id_treematch_contribution_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."treematch_contribution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_allocation" ADD CONSTRAINT "treematch_allocation_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_allocation" ADD CONSTRAINT "treematch_allocation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_allocation" ADD CONSTRAINT "treematch_allocation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_contribution" ADD CONSTRAINT "treematch_contribution_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_contribution" ADD CONSTRAINT "treematch_contribution_ignored_by_id_user_id_fk" FOREIGN KEY ("ignored_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_event" ADD CONSTRAINT "treematch_event_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_event" ADD CONSTRAINT "treematch_event_contribution_id_treematch_contribution_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."treematch_contribution"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_event" ADD CONSTRAINT "treematch_event_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_event" ADD CONSTRAINT "treematch_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_intervention_block" ADD CONSTRAINT "treematch_intervention_block_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_intervention_block" ADD CONSTRAINT "treematch_intervention_block_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_intervention_block" ADD CONSTRAINT "treematch_intervention_block_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_intervention_block" ADD CONSTRAINT "treematch_intervention_block_released_by_id_user_id_fk" FOREIGN KEY ("released_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_allocation_pair_unique" ON "treematch_allocation" USING btree ("contribution_id","intervention_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_allocation_intervention_idx" ON "treematch_allocation" USING btree ("intervention_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_allocation_project_idx" ON "treematch_allocation" USING btree ("project_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_contribution_project_idx" ON "treematch_contribution" USING btree ("project_id","ignored") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_contribution_sync_attention_idx" ON "treematch_contribution" USING btree ("sync_status") WHERE sync_status <> 'synced';--> statement-breakpoint
CREATE INDEX "treematch_event_project_time_idx" ON "treematch_event" USING btree ("project_id","occurred_at");--> statement-breakpoint
CREATE INDEX "treematch_event_contribution_time_idx" ON "treematch_event" USING btree ("contribution_id","occurred_at") WHERE contribution_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "treematch_event_intervention_time_idx" ON "treematch_event" USING btree ("intervention_id","occurred_at") WHERE intervention_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_block_active_unique" ON "treematch_intervention_block" USING btree ("intervention_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_block_project_idx" ON "treematch_intervention_block" USING btree ("project_id") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group" ADD CONSTRAINT "plot_group_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_recorded_by_id_user_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;