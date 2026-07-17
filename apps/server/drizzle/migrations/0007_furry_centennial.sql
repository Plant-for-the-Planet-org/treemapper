CREATE TABLE "treematch_automatch_run" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"matched_units" integer DEFAULT 0 NOT NULL,
	"contributions_matched" integer DEFAULT 0 NOT NULL,
	"interventions_filled" integer DEFAULT 0 NOT NULL,
	"rules_snapshot" jsonb,
	"summary" jsonb,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "treematch_automatch_run_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_automatch_run_valid_status" CHECK (status IN ('running', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "treematch_rule" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"position" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"when_type" text NOT NULL,
	"when_value" text,
	"prefer_type" text NOT NULL,
	"prefer_site_id" integer,
	"order_by" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "treematch_rule_uid_unique" UNIQUE("uid"),
	CONSTRAINT "treematch_rule_valid_when" CHECK (when_type IN ('all', 'company', 'individual', 'country', 'donor')),
	CONSTRAINT "treematch_rule_valid_prefer" CHECK (prefer_type IN ('oldest', 'site', 'capacity')),
	CONSTRAINT "treematch_rule_valid_order" CHECK (order_by IN ('oldest', 'largest')),
	CONSTRAINT "treematch_rule_when_value_required" CHECK (when_type NOT IN ('country', 'donor') OR when_value IS NOT NULL),
	CONSTRAINT "treematch_rule_site_required" CHECK (prefer_type <> 'site' OR prefer_site_id IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "treematch_automatch_run" ADD CONSTRAINT "treematch_automatch_run_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_automatch_run" ADD CONSTRAINT "treematch_automatch_run_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_rule" ADD CONSTRAINT "treematch_rule_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_rule" ADD CONSTRAINT "treematch_rule_prefer_site_id_site_id_fk" FOREIGN KEY ("prefer_site_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treematch_rule" ADD CONSTRAINT "treematch_rule_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_automatch_run_active_unique" ON "treematch_automatch_run" USING btree ("project_id") WHERE status = 'running';--> statement-breakpoint
CREATE INDEX "treematch_automatch_run_project_time_idx" ON "treematch_automatch_run" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "treematch_rule_position_unique" ON "treematch_rule" USING btree ("project_id","position") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "treematch_rule_project_idx" ON "treematch_rule" USING btree ("project_id","position") WHERE deleted_at IS NULL;