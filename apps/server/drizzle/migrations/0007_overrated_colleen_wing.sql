CREATE TABLE "treematch_allocation" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"ttc_contribution_id" integer NOT NULL,
	"intervention_id" integer NOT NULL,
	"units" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treematch_allocation_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_allocation_units_positive" CHECK (units > 0)
);
--> statement-breakpoint
CREATE TABLE "treematch_automatch_run" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"rules_snapshot" jsonb,
	"plan" jsonb,
	"progress" jsonb,
	"stop_requested" boolean DEFAULT false NOT NULL,
	"matched_units" integer DEFAULT 0 NOT NULL,
	"contributions_matched" integer DEFAULT 0 NOT NULL,
	"interventions_filled" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"planned_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	CONSTRAINT "treematch_automatch_run_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_automatch_run_valid_status" CHECK (status IN ('planning', 'planned', 'applying', 'completed', 'failed', 'discarded'))
);
--> statement-breakpoint
CREATE TABLE "treematch_rule" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"position" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"label" text NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treematch_rule_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "treematch_allocation" ADD CONSTRAINT "treematch_allocation_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_automatch_run" ADD CONSTRAINT "treematch_automatch_run_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_automatch_run" ADD CONSTRAINT "treematch_automatch_run_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_rule" ADD CONSTRAINT "treematch_rule_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_allocation_pair_unique" ON "treematch_allocation" USING btree ("ttc_contribution_id","intervention_id");--> statement-breakpoint
CREATE INDEX "treematch_allocation_intervention_idx" ON "treematch_allocation" USING btree ("intervention_id");--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_automatch_run_open_unique" ON "treematch_automatch_run" USING btree ("project_id") WHERE status IN ('planning', 'planned', 'applying');--> statement-breakpoint
CREATE INDEX "treematch_automatch_run_project_time_idx" ON "treematch_automatch_run" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_rule_position_unique" ON "treematch_rule" USING btree ("project_id","position");--> statement-breakpoint
CREATE INDEX "treematch_rule_project_idx" ON "treematch_rule" USING btree ("project_id","position");
