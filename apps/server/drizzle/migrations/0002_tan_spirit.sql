ALTER TYPE "public"."intervention_status" ADD VALUE 'planning' BEFORE 'active';--> statement-breakpoint
CREATE TABLE "project_api_key" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_api_key_uid_unique" UNIQUE("uid"),
	CONSTRAINT "project_api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "api_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_member" ADD COLUMN "extra_permissions" text[];--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_api_key_project_unique" ON "project_api_key" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_api_key_hash_idx" ON "project_api_key" USING btree ("key_hash");