CREATE TYPE "public"."landmark_type" AS ENUM('nursery', 'meeting_point', 'school', 'office', 'storage', 'water_source', 'other');--> statement-breakpoint
CREATE TABLE "site_landmark" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"site_id" integer,
	"type" "landmark_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"other_label" text,
	"location" geometry(Geometry,4326) NOT NULL,
	"image" text,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "site_landmark_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "site_landmark" ADD CONSTRAINT "site_landmark_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_landmark" ADD CONSTRAINT "site_landmark_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_landmark" ADD CONSTRAINT "site_landmark_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_landmark_project_active_idx" ON "site_landmark" USING btree ("project_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "site_landmark_site_idx" ON "site_landmark" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "site_landmark_location_gist_idx" ON "site_landmark" USING gist ("location");