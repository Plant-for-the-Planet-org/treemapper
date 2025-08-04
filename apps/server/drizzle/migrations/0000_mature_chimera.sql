CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'soft_delete', 'restore', 'login', 'logout', 'invite', 'accept_invite', 'decline_invite', 'role_change', 'permission_change', 'export', 'import', 'archive', 'unarchive');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('user', 'workspace', 'workspace_member', 'project', 'project_member', 'site', 'intervention', 'tree', 'tree_record', 'scientific_species', 'project_species', 'species_request', 'project_invite', 'bulk_invite', 'image', 'notification', 'migration');--> statement-breakpoint
CREATE TYPE "public"."capture_mode" AS ENUM('on-site', 'off-site', 'external', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."capture_status" AS ENUM('complete', 'partial', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('users', 'projects', 'interventions', 'species', 'sites', 'images');--> statement-breakpoint
CREATE TYPE "public"."image_entity" AS ENUM('project', 'site', 'user', 'intervention', 'tree');--> statement-breakpoint
CREATE TYPE "public"."image_type" AS ENUM('before', 'during', 'after', 'detail', 'overview', 'progress', 'aerial', 'ground', 'record');--> statement-breakpoint
CREATE TYPE "public"."image_upload_device" AS ENUM('web', 'mobile');--> statement-breakpoint
CREATE TYPE "public"."intervention_discriminator" AS ENUM('plot', 'intervention');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('planned', 'active', 'completed', 'failed', 'on-hold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."intervention_type" AS ENUM('assisting-seed-rain', 'control-livestock', 'direct-seeding', 'enrichment-planting', 'fencing', 'fire-patrol', 'fire-suppression', 'firebreaks', 'generic-tree-registration', 'grass-suppression', 'liberating-regenerant', 'maintenance', 'marking-regenerant', 'multi-tree-registration', 'other-intervention', 'plot-plant-registration', 'removal-invasive-species', 'sample-tree-registration', 'single-tree-registration', 'soil-improvement', 'stop-tree-harvesting');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined', 'expired', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warning', 'error', 'fatal');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."migration_status" AS ENUM('in_progress', 'completed', 'failed', 'started');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('project', 'site', 'member', 'intervention', 'tree', 'species', 'user', 'invite', 'system', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('owner', 'admin', 'contributor', 'observer');--> statement-breakpoint
CREATE TYPE "public"."record_type" AS ENUM('planting', 'measurement', 'status_change', 'inspection', 'maintenance', 'death', 'removal', 'health_assessment', 'growth_monitoring');--> statement-breakpoint
CREATE TYPE "public"."site_access" AS ENUM('all_sites', 'deny_all', 'read_only', 'limited_access');--> statement-breakpoint
CREATE TYPE "public"."site_status" AS ENUM('planted', 'planting', 'barren', 'reforestation');--> statement-breakpoint
CREATE TYPE "public"."species_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."tree_status" AS ENUM('alive', 'dead', 'unknown', 'removed', 'sick');--> statement-breakpoint
CREATE TYPE "public"."tree_enum" AS ENUM('single', 'sample', 'plot');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('individual', 'tpo', 'organization', 'other', 'school', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('platform', 'private', 'development', 'premium');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity" NOT NULL,
	"entity_id" text NOT NULL,
	"entity_uid" text,
	"user_id" integer,
	"workspace_id" integer,
	"project_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" text[],
	"description" text,
	"source" text DEFAULT 'web',
	"user_agent" text,
	"ip_address" text,
	"session_id" text,
	"request_id" text,
	"reason" text,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "bulk_invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"restriction" text[] DEFAULT '{}',
	"message" text,
	"project_role" "project_role" DEFAULT 'contributor' NOT NULL,
	"invited_by_id" integer NOT NULL,
	"discarded_by" integer,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bulk_invite_uid_unique" UNIQUE("uid"),
	CONSTRAINT "bulk_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"type" "image_type" DEFAULT 'overview' NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_type" "image_entity" NOT NULL,
	"filename" text,
	"original_name" text,
	"mime_type" text,
	"size" bigint,
	"width" integer,
	"height" integer,
	"notes" text,
	"device_type" "image_upload_device" NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "image_uid_unique" UNIQUE("uid"),
	CONSTRAINT "size_positive" CHECK (size IS NULL OR size > 0),
	CONSTRAINT "dimensions_positive" CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0)),
	CONSTRAINT "reasonable_file_size" CHECK (size IS NULL OR size <= 104857600)
);
--> statement-breakpoint
CREATE TABLE "intervention" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"hid" text NOT NULL,
	"discr" "intervention_discriminator" DEFAULT 'intervention' NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"project_site_id" integer,
	"parent_intervention_id" integer,
	"type" "intervention_type" NOT NULL,
	"idempotency_key" text NOT NULL,
	"capture_mode" "capture_mode" DEFAULT 'unknown' NOT NULL,
	"capture_status" "capture_status" DEFAULT 'complete' NOT NULL,
	"registration_date" timestamp with time zone NOT NULL,
	"intervention_start_date" timestamp with time zone NOT NULL,
	"intervention_end_date" timestamp with time zone NOT NULL,
	"location" geometry(Geometry,4326),
	"original_geometry" jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"area" double precision,
	"device_location" jsonb,
	"tree_count" integer DEFAULT 0,
	"sample_tree_count" integer DEFAULT 0,
	"intervention_status" "intervention_status" DEFAULT 'active',
	"description" text,
	"image" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"species" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"has_records" boolean DEFAULT false,
	"flag_reason" jsonb,
	"deleted_at" timestamp with time zone,
	"migrated_intervention" boolean DEFAULT false,
	CONSTRAINT "intervention_uid_unique" UNIQUE("uid"),
	CONSTRAINT "intervention_hid_unique" UNIQUE("hid"),
	CONSTRAINT "intervention_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "area_positive" CHECK (area IS NULL OR area >= 0),
	CONSTRAINT "tree_count_non_negative" CHECK (tree_count >= 0),
	CONSTRAINT "sample_tree_count_non_negative" CHECK (sample_tree_count >= 0),
	CONSTRAINT "valid_date_range" CHECK (intervention_start_date <= intervention_end_date)
);
--> statement-breakpoint
CREATE TABLE "migration" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"user_id" integer NOT NULL,
	"planet_id" text NOT NULL,
	"status" "migration_status" DEFAULT 'in_progress' NOT NULL,
	"migrated_entities" jsonb DEFAULT '{"user":false,"projects":false,"sites":false,"species":false,"interventions":false,"images":false}'::jsonb,
	"migration_completed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"migration_version" text DEFAULT '1.0',
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	CONSTRAINT "migration_uid_unique" UNIQUE("uid"),
	CONSTRAINT "migration_planet_id_unique" UNIQUE("planet_id")
);
--> statement-breakpoint
CREATE TABLE "migration_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"migration_id" integer NOT NULL,
	"uid" text NOT NULL,
	"level" "log_level" NOT NULL,
	"message" text NOT NULL,
	"entity" "entity_type",
	"entity_id" text,
	"stack_trace" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_id" integer,
	"priority" text DEFAULT 'normal',
	"category" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"action_text" text,
	"scheduled_for" timestamp,
	"expires_at" timestamp,
	"delivery_method" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"workspace_id" integer NOT NULL,
	"slug" text NOT NULL,
	"purpose" text,
	"project_name" text NOT NULL,
	"project_type" text,
	"ecosystem" text,
	"project_scale" text,
	"target" integer,
	"project_website" text,
	"description" text,
	"classification" text,
	"image" text,
	"video_url" text,
	"country" char(3),
	"location" geometry(Geometry,4326),
	"original_geometry" jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_personal" boolean DEFAULT false NOT NULL,
	"intensity" text,
	"revision_periodicity_level" text,
	"metadata" jsonb,
	"migrated_project" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	CONSTRAINT "project_uid_unique" UNIQUE("uid"),
	CONSTRAINT "project_slug_unique" UNIQUE("slug"),
	CONSTRAINT "target_positive" CHECK (target IS NULL OR target > 0),
	CONSTRAINT "latitude_range" CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
	CONSTRAINT "longitude_range" CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);
--> statement-breakpoint
CREATE TABLE "project_invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"email" text NOT NULL,
	"message" text,
	"project_role" "project_role" DEFAULT 'contributor' NOT NULL,
	"invited_by_id" integer NOT NULL,
	"discarded_by" integer,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_invite_uid_unique" UNIQUE("uid"),
	CONSTRAINT "project_invite_token_unique" UNIQUE("token"),
	CONSTRAINT "accepted_before_expiry" CHECK (accepted_at IS NULL OR accepted_at <= expires_at),
	CONSTRAINT "expires_in_future" CHECK (expires_at > created_at)
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"project_role" "project_role" DEFAULT 'contributor' NOT NULL,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bulk_invite_id" integer,
	"site_access" "site_access" DEFAULT 'all_sites' NOT NULL,
	"restricted_sites" text[] DEFAULT '{}',
	CONSTRAINT "project_member_uid_unique" UNIQUE("uid"),
	CONSTRAINT "unique_project_member" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"scientific_species_id" integer NOT NULL,
	"scientific_species_uid" text,
	"is_unknown" boolean DEFAULT false NOT NULL,
	"species_name" text,
	"is_native_species" boolean DEFAULT false,
	"is_endangered" boolean DEFAULT false,
	"is_disabled" boolean DEFAULT false,
	"project_id" integer NOT NULL,
	"added_by_id" integer NOT NULL,
	"common_name" text,
	"image" text,
	"description" text,
	"notes" text,
	"favourite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "project_species_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "scientific_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"scientific_name" text NOT NULL,
	"common_name" text,
	"family" text,
	"genus" text,
	"description" text,
	"image" text,
	"gbif_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "scientific_species_uid_unique" UNIQUE("uid"),
	CONSTRAINT "scientific_species_scientific_name_unique" UNIQUE("scientific_name")
);
--> statement-breakpoint
CREATE TABLE "site" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" geometry(Geometry,4326),
	"original_geometry" jsonb,
	"latitude" double precision,
	"image" text,
	"longitude" double precision,
	"area" double precision,
	"status" "site_status" DEFAULT 'planting',
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	"migrated_site" boolean DEFAULT false,
	CONSTRAINT "site_uid_unique" UNIQUE("uid"),
	CONSTRAINT "area_positive" CHECK (area IS NULL OR area > 0),
	CONSTRAINT "latitude_range" CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
	CONSTRAINT "longitude_range" CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);
--> statement-breakpoint
CREATE TABLE "species_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"scientific_name" text NOT NULL,
	"common_name" text,
	"description" text,
	"request_reason" text,
	"gbif_id" text,
	"requested_by_id" integer NOT NULL,
	"project_id" integer,
	"status" "species_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" integer,
	"admin_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "species_request_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "survey" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"user_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"organizationName" text,
	"primary_goal" text,
	"role" text,
	"requested_demo" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "tree" (
	"id" serial PRIMARY KEY NOT NULL,
	"hid" text NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer,
	"intervention_species_id" text,
	"species_name" text,
	"is_unknown" boolean DEFAULT false,
	"created_by_id" integer NOT NULL,
	"tag" text,
	"tree_type" "tree_enum" DEFAULT 'sample',
	"altitude" numeric(8, 2),
	"accuracy" numeric(6, 2),
	"location" geometry(Geometry,4326),
	"original_geometry" jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"height" double precision,
	"width" double precision,
	"status" "tree_status" DEFAULT 'alive' NOT NULL,
	"status_reason" text,
	"planting_date" timestamp with time zone,
	"last_measurement_date" timestamp with time zone,
	"next_measurement_date" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	CONSTRAINT "tree_hid_unique" UNIQUE("hid"),
	CONSTRAINT "tree_uid_unique" UNIQUE("uid"),
	CONSTRAINT "height_positive" CHECK (height IS NULL OR height >= 0),
	CONSTRAINT "width_positive" CHECK (width IS NULL OR width >= 0),
	CONSTRAINT "altitude_range" CHECK (altitude IS NULL OR (altitude >= -500 AND altitude <= 9000)),
	CONSTRAINT "accuracy_positive" CHECK (accuracy IS NULL OR accuracy >= 0)
);
--> statement-breakpoint
CREATE TABLE "tree_record" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"tree_id" integer NOT NULL,
	"recorded_by_id" integer NOT NULL,
	"record_type" "record_type" NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"image" text,
	"height" double precision,
	"width" double precision,
	"health_score" integer,
	"vitality_score" integer,
	"structural_integrity" text,
	"previous_status" "tree_status",
	"new_status" "tree_status",
	"status_reason" text,
	"findings" text,
	"findings_severity" text,
	"findings_comments" text,
	"notes" text,
	"weather_conditions" jsonb,
	"soil_conditions" jsonb,
	"surrounding_vegetation" text,
	"pests_observed" jsonb,
	"diseases_observed" jsonb,
	"damage_observed" jsonb,
	"growth_rate" numeric(6, 3),
	"leaf_density" text,
	"fruiting_status" text,
	"recommended_actions" jsonb,
	"priority_level" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"device_location" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tree_record_uid_unique" UNIQUE("uid"),
	CONSTRAINT "health_score_range" CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
	CONSTRAINT "vitality_score_range" CHECK (vitality_score IS NULL OR (vitality_score >= 0 AND vitality_score <= 100)),
	CONSTRAINT "height_positive" CHECK (height IS NULL OR height >= 0),
	CONSTRAINT "width_positive" CHECK (width IS NULL OR width >= 0),
	CONSTRAINT "recorded_at_not_future" CHECK (recorded_at <= NOW())
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"auth0_id" text NOT NULL,
	"email" text NOT NULL,
	"firstname" text,
	"lastname" text,
	"display_name" text NOT NULL,
	"primary_workspace" text,
	"primary_project" text,
	"image" text,
	"slug" text NOT NULL,
	"type" "user_type" DEFAULT 'individual',
	"country" char(3),
	"url" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone DEFAULT now(),
	"bio" text,
	"locale" text DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"deleted_at" timestamp with time zone,
	"migrated_at" timestamp with time zone,
	"existing_planet_user" boolean DEFAULT false,
	CONSTRAINT "user_uid_unique" UNIQUE("uid"),
	CONSTRAINT "user_auth0_id_unique" UNIQUE("auth0_id"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_slug_unique" UNIQUE("slug"),
	CONSTRAINT "email_format" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'),
	CONSTRAINT "slug_format" CHECK (slug ~* '^[a-z0-9-]+$' AND length(slug) >= 3)
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "workspace_type" NOT NULL,
	"description" text,
	"logo" text,
	"primary_color" text,
	"secondary_color" text,
	"email" text,
	"phone" text,
	"website" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "workspace_uid_unique" UNIQUE("uid"),
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"workspace_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"status" "member_status" DEFAULT 'active',
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invited_at" timestamp with time zone,
	"invited_by_id" integer,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "workspace_member_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_discarded_by_user_id_fk" FOREIGN KEY ("discarded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_project_site_id_site_id_fk" FOREIGN KEY ("project_site_id") REFERENCES "public"."site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_parent_intervention_id_intervention_id_fk" FOREIGN KEY ("parent_intervention_id") REFERENCES "public"."intervention"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration" ADD CONSTRAINT "migration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_log" ADD CONSTRAINT "migration_log_migration_id_migration_id_fk" FOREIGN KEY ("migration_id") REFERENCES "public"."migration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_discarded_by_user_id_fk" FOREIGN KEY ("discarded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_bulk_invite_id_bulk_invite_id_fk" FOREIGN KEY ("bulk_invite_id") REFERENCES "public"."bulk_invite"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_scientific_species_id_scientific_species_id_fk" FOREIGN KEY ("scientific_species_id") REFERENCES "public"."scientific_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey" ADD CONSTRAINT "survey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_recorded_by_id_user_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_primary_workspace_workspace_uid_fk" FOREIGN KEY ("primary_workspace") REFERENCES "public"."workspace"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_primary_project_project_uid_fk" FOREIGN KEY ("primary_project") REFERENCES "public"."project"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_idx" ON "audit_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_project_idx" ON "audit_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_time_idx" ON "audit_log" USING btree ("entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_time_idx" ON "audit_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_time_idx" ON "audit_log" USING btree ("workspace_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_changed_fields_gin_idx" ON "audit_log" USING gin ("changed_fields");--> statement-breakpoint
CREATE INDEX "audit_log_old_values_gin_idx" ON "audit_log" USING gin ("old_values");--> statement-breakpoint
CREATE INDEX "audit_log_new_values_gin_idx" ON "audit_log" USING gin ("new_values");--> statement-breakpoint
CREATE INDEX "project_bulk_invites_project_idx" ON "bulk_invite" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_bulk_invites_deleted_at_idx" ON "bulk_invite" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "entityId_images__id_idx" ON "image" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "interventions_project_idx" ON "intervention" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "interventions_project_site_idx" ON "intervention" USING btree ("project_site_id");--> statement-breakpoint
CREATE INDEX "parent_idx" ON "intervention" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "interventions_user_idx" ON "intervention" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interventions_type_idx" ON "intervention" USING btree ("type");--> statement-breakpoint
CREATE INDEX "interventions_species_gin_idx" ON "intervention" USING gin ("species");--> statement-breakpoint
CREATE INDEX "interventions_start_date_idx" ON "intervention" USING btree ("intervention_start_date");--> statement-breakpoint
CREATE INDEX "interventions_project_date_range_idx" ON "intervention" USING btree ("project_id","intervention_start_date");--> statement-breakpoint
CREATE INDEX "migration_id_idx" ON "migration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "migration_logs_idx" ON "migration_log" USING btree ("migration_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_is_archived_idx" ON "notifications" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_expires_at_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_category_idx" ON "notifications" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id") WHERE is_read = false AND is_archived = false;--> statement-breakpoint
CREATE INDEX "projects_location_gist_idx" ON "project" USING gist ("location");--> statement-breakpoint
CREATE INDEX "project_created_by_id_idx" ON "project" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "projects_workpsace_by_idx" ON "project" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "project_invites_project_idx" ON "project_invite" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_invites_email_idx" ON "project_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "project_invites_project_status_idx" ON "project_invite" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "project_members_project_idx" ON "project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_members_role_idx" ON "project_member" USING btree ("project_role");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_species" ON "project_species" USING btree ("project_id","scientific_species_id");--> statement-breakpoint
CREATE INDEX "project_species_scientific_species_idx" ON "project_species" USING btree ("scientific_species_id");--> statement-breakpoint
CREATE INDEX "project_species_projects_idx" ON "project_species" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_species_added_by_idx" ON "project_species" USING btree ("added_by_id");--> statement-breakpoint
CREATE INDEX "project_species_native_idx" ON "project_species" USING btree ("is_native_species");--> statement-breakpoint
CREATE INDEX "scientific_species_name_idx" ON "scientific_species" USING btree ("scientific_name");--> statement-breakpoint
CREATE INDEX "scientific_species_uid_idx" ON "scientific_species" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "sites_project_id_idx" ON "site" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sites_location_gist_idx" ON "site" USING gist ("location");--> statement-breakpoint
CREATE INDEX "species_requests_requested_by_idx" ON "species_request" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "survey_user_idx" ON "survey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trees_intervention_idx" ON "tree" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "trees_created_by_idx" ON "tree" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "trees_status_idx" ON "tree" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trees_type_idx" ON "tree" USING btree ("tree_type");--> statement-breakpoint
CREATE INDEX "trees_planting_date_idx" ON "tree" USING btree ("planting_date");--> statement-breakpoint
CREATE INDEX "trees_last_measurement_idx" ON "tree" USING btree ("last_measurement_date");--> statement-breakpoint
CREATE INDEX "trees_location_gist_idx" ON "tree" USING gist ("location");--> statement-breakpoint
CREATE INDEX "tree_records_tree_id_idx" ON "tree_record" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX "tree_records_recorded_by_idx" ON "tree_record" USING btree ("recorded_by_id");--> statement-breakpoint
CREATE INDEX "workspace_name_idx" ON "workspace" USING btree ("name");--> statement-breakpoint
CREATE INDEX "workspace_slug_idx" ON "workspace" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspace_type_idx" ON "workspace" USING btree ("type");--> statement-breakpoint
CREATE INDEX "workspace_created_by_idx" ON "workspace" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "workspace_members_idx" ON "workspace_member" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_member" USING btree ("user_id");