CREATE TYPE "public"."form_intervention_assignment" AS ENUM('all', 'specific');--> statement-breakpoint
CREATE TYPE "public"."form_site_assignment" AS ENUM('all', 'none', 'specific');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."intervention_source" AS ENUM('web', 'bulk', 'mobile', 'migration');--> statement-breakpoint
CREATE TYPE "public"."plot_shape" AS ENUM('circle', 'rectangle', 'polygon');--> statement-breakpoint
ALTER TYPE "public"."audit_entity" ADD VALUE 'form';--> statement-breakpoint
CREATE TABLE "form" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"site_assignment" "form_site_assignment" DEFAULT 'all' NOT NULL,
	"site_ids" text[] DEFAULT '{}',
	"intervention_assignment" "form_intervention_assignment" DEFAULT 'all' NOT NULL,
	"intervention_types" "intervention_type"[] DEFAULT '{}',
	"schema" jsonb DEFAULT '{"sections":[]}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "form_uid_unique" UNIQUE("uid"),
	CONSTRAINT "form_published_requires_timestamp" CHECK (status != 'published' OR published_at IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "monitoring_plot" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer NOT NULL,
	"shape" "plot_shape",
	"plot_type" text,
	"complexity" text,
	"radius" double precision,
	"length" double precision,
	"width" double precision,
	"center_location" geometry(Geometry,4326),
	"is_complete" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "monitoring_plot_uid_unique" UNIQUE("uid"),
	CONSTRAINT "monitoring_plot_intervention_id_unique" UNIQUE("intervention_id"),
	CONSTRAINT "plot_dimensions_positive" CHECK ((radius IS NULL OR radius >= 0) AND (length IS NULL OR length >= 0) AND (width IS NULL OR width >= 0))
);
--> statement-breakpoint
CREATE TABLE "plot_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "plot_group_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "plot_group_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"group_id" integer NOT NULL,
	"intervention_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plot_group_membership_uid_unique" UNIQUE("uid"),
	CONSTRAINT "plot_group_membership_unique" UNIQUE("group_id","intervention_id")
);
--> statement-breakpoint
CREATE TABLE "plot_observation" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer NOT NULL,
	"type" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"unit" text,
	"value" double precision,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "plot_observation_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "settings" SET DEFAULT '{"approvalBoardEnabled":false,"approvalSettings":{"sources":{"web":true,"bulk":true,"mobile":true},"siteApprovalRequired":true},"defaultProjectVisibility":"private","allowMemberInvites":false,"requireApprovalForNewProjects":false,"maxProjects":null,"notifications":{"onProjectCreate":false,"onInterventionCreate":false,"interventionProjectWhitelist":[],"onProfileActivity":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "discriminator" "intervention_discriminator" DEFAULT 'intervention' NOT NULL;--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "source" "intervention_source";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "approval_settings" jsonb DEFAULT '{"sources":{"web":true,"bulk":true,"mobile":true},"siteApprovalRequired":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_plot" ADD CONSTRAINT "monitoring_plot_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group" ADD CONSTRAINT "plot_group_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group" ADD CONSTRAINT "plot_group_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group_membership" ADD CONSTRAINT "plot_group_membership_group_id_plot_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."plot_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group_membership" ADD CONSTRAINT "plot_group_membership_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_observation" ADD CONSTRAINT "plot_observation_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_project_idx" ON "form" USING btree ("project_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "monitoring_plot_intervention_idx" ON "monitoring_plot" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "monitoring_plot_center_gist_idx" ON "monitoring_plot" USING gist ("center_location");--> statement-breakpoint
CREATE INDEX "plot_group_project_idx" ON "plot_group" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "plot_group_membership_group_idx" ON "plot_group_membership" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "plot_group_membership_plot_idx" ON "plot_group_membership" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "plot_observation_intervention_idx" ON "plot_observation" USING btree ("intervention_id","observed_at");--> statement-breakpoint
CREATE INDEX "intervention_plot_idx" ON "intervention" USING btree ("project_id","discriminator") WHERE discriminator = 'plot' AND deleted_at IS NULL;