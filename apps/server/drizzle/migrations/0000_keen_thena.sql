CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'soft_delete', 'restore', 'login', 'logout', 'invite', 'accept_invite', 'decline_invite', 'role_change', 'permission_change', 'export', 'import', 'archive', 'unarchive', 'impersonation');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('user', 'workspace', 'workspace_member', 'project', 'project_member', 'site', 'intervention', 'tree', 'tree_record', 'scientific_species', 'project_species', 'species_request', 'project_invite', 'bulk_invite', 'image', 'notification', 'migration');--> statement-breakpoint
CREATE TYPE "public"."capture_mode" AS ENUM('on-site', 'off-site', 'external', 'unknown', 'web-upload');--> statement-breakpoint
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
CREATE TYPE "public"."site_status" AS ENUM('planted', 'planting', 'barren', 'reforestation', 'planning');--> statement-breakpoint
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
	"source" text DEFAULT 'web',
	"ip_address" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_uid_unique" UNIQUE("uid"),
	CONSTRAINT "valid_entity_id" CHECK (length(trim(entity_id)) > 0),
	CONSTRAINT "valid_source" CHECK (source IN ('web', 'mobile', 'api', 'system', 'migration')),
	CONSTRAINT "occurred_at_not_future" CHECK (occurred_at <= NOW())
);
--> statement-breakpoint
CREATE TABLE "bulk_invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"email_domain_restrictions" text[] DEFAULT '{}',
	"message" text,
	"project_role" "project_role" DEFAULT 'contributor' NOT NULL,
	"invited_by_id" integer NOT NULL,
	"discarded_by_id" integer,
	"discarded_at" timestamp with time zone,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_uses" integer DEFAULT 100,
	"current_uses" integer DEFAULT 0,
	"total_invites_sent" integer DEFAULT 0,
	"total_accepted" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bulk_invite_uid_unique" UNIQUE("uid"),
	CONSTRAINT "bulk_invite_token_unique" UNIQUE("token"),
	CONSTRAINT "expires_in_future" CHECK (expires_at > created_at),
	CONSTRAINT "max_uses_positive" CHECK (max_uses IS NULL OR max_uses > 0),
	CONSTRAINT "current_uses_valid" CHECK (current_uses >= 0 AND (max_uses IS NULL OR current_uses <= max_uses)),
	CONSTRAINT "analytics_valid" CHECK (total_invites_sent >= 0 AND total_accepted >= 0 AND total_accepted <= total_invites_sent),
	CONSTRAINT "expired_or_discarded_not_pending" CHECK ((status != 'expired' OR expires_at <= NOW()) AND (status != 'discarded' OR discarded_by_id IS NOT NULL)),
	CONSTRAINT "discarded_has_timestamp" CHECK (discarded_by_id IS NULL OR discarded_at IS NOT NULL),
	CONSTRAINT "valid_email_domains" CHECK (array_length(email_domain_restrictions, 1) IS NULL OR array_length(email_domain_restrictions, 1) > 0)
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
	"storage_provider" text DEFAULT 'r2',
	"storage_path" text,
	"thumbnail_path" text,
	"compression_ratio" numeric(4, 2),
	"uploaded_by_id" integer,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "image_uid_unique" UNIQUE("uid"),
	CONSTRAINT "size_positive" CHECK (size IS NULL OR size > 0),
	CONSTRAINT "dimensions_positive" CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0)),
	CONSTRAINT "reasonable_file_size" CHECK (size IS NULL OR size <= 104857600),
	CONSTRAINT "primary_image_logic" CHECK (is_primary = false OR (is_primary = true AND deleted_at IS NULL)),
	CONSTRAINT "valid_mime_type" CHECK (mime_type IS NULL OR mime_type ~* '^image/(jpeg|jpg|png|gif|webp|svg+xml)$'),
	CONSTRAINT "filename_required" CHECK (filename IS NOT NULL AND length(trim(filename)) > 0)
);
--> statement-breakpoint
CREATE TABLE "intervention" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"hid" text NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"site_id" integer,
	"type" "intervention_type" NOT NULL,
	"status" "intervention_status" DEFAULT 'planned',
	"idempotency_key" text NOT NULL,
	"registration_date" timestamp with time zone NOT NULL,
	"intervention_start_date" timestamp with time zone NOT NULL,
	"intervention_end_date" timestamp with time zone NOT NULL,
	"location" geometry(Geometry,4326),
	"area" double precision,
	"total_tree_count" integer DEFAULT 0,
	"total_sample_tree_count" integer DEFAULT 0,
	"capture_mode" "capture_mode" DEFAULT 'on-site' NOT NULL,
	"capture_status" "capture_status" DEFAULT 'complete' NOT NULL,
	"device_location" jsonb,
	"original_geometry" jsonb,
	"description" text,
	"image" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"flag" boolean DEFAULT false,
	"edited_at" timestamp with time zone,
	"flag_reason" jsonb,
	"migrated_intervention" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "intervention_uid_unique" UNIQUE("uid"),
	CONSTRAINT "intervention_hid_unique" UNIQUE("hid"),
	CONSTRAINT "intervention_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "valid_date_range" CHECK (intervention_start_date <= intervention_end_date),
	CONSTRAINT "area_positive" CHECK (area IS NULL OR area >= 0),
	CONSTRAINT "tree_counts_non_negative" CHECK (total_tree_count >= 0 AND total_sample_tree_count >= 0),
	CONSTRAINT "flagged_has_reason" CHECK (flag = false OR flag_reason IS NOT NULL),
	CONSTRAINT "registration_not_future" CHECK (registration_date <= NOW())
);
--> statement-breakpoint
CREATE TABLE "intervention_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"intervention_id" integer NOT NULL,
	"scientific_species_id" integer,
	"is_unknown" boolean DEFAULT false NOT NULL,
	"species_name" text,
	"species_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intervention_species_uid_unique" UNIQUE("uid"),
	CONSTRAINT "unknown_species_logic" CHECK ((is_unknown = false AND scientific_species_id IS NOT NULL) OR (is_unknown = true AND scientific_species_id IS NULL)),
	CONSTRAINT "species_count_positive" CHECK (species_count > 0)
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
	"batch_id" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_uid_unique" UNIQUE("uid"),
	CONSTRAINT "valid_priority" CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
	CONSTRAINT "scheduled_in_future" CHECK (scheduled_for IS NULL OR scheduled_for >= created_at),
	CONSTRAINT "expires_after_creation" CHECK (expires_at IS NULL OR expires_at > created_at),
	CONSTRAINT "delivered_after_sent" CHECK (delivered_at IS NULL OR sent_at IS NULL OR delivered_at >= sent_at),
	CONSTRAINT "retry_count_valid" CHECK (retry_count >= 0 AND retry_count <= 10)
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"workspace_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"purpose" text,
	"type" text,
	"ecosystem" text,
	"scale" text,
	"classification" text,
	"target" integer,
	"original_geometry" jsonb,
	"website" text,
	"image" text,
	"video_url" text,
	"country" char(3),
	"location" geometry(Geometry,4326),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_personal" boolean DEFAULT false NOT NULL,
	"intensity" text,
	"revision_periodicity" text,
	"migrated_project" boolean DEFAULT false,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "project_uid_unique" UNIQUE("uid"),
	CONSTRAINT "project_slug_unique" UNIQUE("slug"),
	CONSTRAINT "target_positive" CHECK (target IS NULL OR target > 0),
	CONSTRAINT "valid_intensity" CHECK (intensity IS NULL OR intensity IN ('low', 'medium', 'high')),
	CONSTRAINT "valid_scale" CHECK (scale IS NULL OR scale IN ('small', 'medium', 'large', 'enterprise')),
	CONSTRAINT "website_format" CHECK (website IS NULL OR website ~* '^https?://'),
	CONSTRAINT "primary_project_logic" CHECK (is_primary = false OR (is_primary = true AND is_active = true)),
	CONSTRAINT "public_project_logic" CHECK (is_personal = false OR is_public = false),
	CONSTRAINT "flagged_project_reason" CHECK (flag = false OR flag_reason IS NOT NULL)
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
	"discarded_by_id" integer,
	"discarded_at" timestamp with time zone,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0,
	"invite_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_invite_uid_unique" UNIQUE("uid"),
	CONSTRAINT "project_invite_token_unique" UNIQUE("token"),
	CONSTRAINT "accepted_before_expiry" CHECK (accepted_at IS NULL OR accepted_at <= expires_at),
	CONSTRAINT "expires_in_future" CHECK (expires_at > created_at),
	CONSTRAINT "valid_email" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'),
	CONSTRAINT "accepted_status_has_timestamp" CHECK (status != 'accepted' OR accepted_at IS NOT NULL),
	CONSTRAINT "discarded_status_has_details" CHECK (status != 'discarded' OR (discarded_by_id IS NOT NULL AND discarded_at IS NOT NULL)),
	CONSTRAINT "expired_status_after_expiry" CHECK (status != 'expired' OR expires_at <= NOW()),
	CONSTRAINT "retry_count_valid" CHECK (retry_count >= 0 AND retry_count <= 5),
	CONSTRAINT "delivered_after_sent" CHECK (delivered_at IS NULL OR sent_at IS NULL OR delivered_at >= sent_at)
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"project_role" "project_role" DEFAULT 'contributor' NOT NULL,
	"invited_at" timestamp with time zone,
	"invited_by_id" integer,
	"joined_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"status" "member_status" DEFAULT 'active',
	"site_access" "site_access" DEFAULT 'all_sites' NOT NULL,
	"restricted_sites" text[] DEFAULT '{}',
	"bulk_invite_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "project_member_uid_unique" UNIQUE("uid"),
	CONSTRAINT "unique_project_member" UNIQUE("project_id","user_id"),
	CONSTRAINT "joined_after_invited" CHECK (invited_at IS NULL OR joined_at IS NULL OR joined_at >= invited_at),
	CONSTRAINT "active_member_joined" CHECK (status != 'active' OR joined_at IS NOT NULL),
	CONSTRAINT "inviter_not_self" CHECK (invited_by_id IS NULL OR invited_by_id != user_id),
	CONSTRAINT "restricted_sites_valid_access" CHECK (site_access != 'limited_access' OR array_length(restricted_sites, 1) > 0)
);
--> statement-breakpoint
CREATE TABLE "project_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"scientific_species_id" integer,
	"is_unknown" boolean DEFAULT false NOT NULL,
	"species_name" text,
	"common_name" text,
	"image" text,
	"notes" text,
	"favourite" boolean DEFAULT false NOT NULL,
	"is_disabled" boolean DEFAULT false,
	"added_by_id" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "project_species_uid_unique" UNIQUE("uid"),
	CONSTRAINT "unique_project_species" UNIQUE("project_id","scientific_species_id")
);
--> statement-breakpoint
CREATE TABLE "scientific_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"scientific_name" text NOT NULL,
	"common_name" text,
	"kingdom" text DEFAULT 'Plantae',
	"phylum" text DEFAULT 'Tracheophyta',
	"class" text DEFAULT 'Magnoliopsida',
	"order" text,
	"family" text,
	"genus" text,
	"species" text,
	"subspecies" text,
	"cultivar" text,
	"habitat" text[] DEFAULT '{}',
	"native_regions" text[] DEFAULT '{}',
	"climate_zones" text[] DEFAULT '{}',
	"soil_types" text[] DEFAULT '{}',
	"drainage_preference" text,
	"ph_tolerance" text,
	"salt_tolerance" text,
	"mature_height" double precision,
	"mature_width" double precision,
	"growth_rate" text,
	"lifespan" integer,
	"root_system" text,
	"light_requirement" text,
	"water_requirement" text,
	"temperature_minimum" double precision,
	"temperature_maximum" double precision,
	"frost_tolerance" boolean DEFAULT false,
	"drought_tolerance" boolean DEFAULT false,
	"conservation_status" text,
	"is_native" boolean DEFAULT true,
	"is_invasive" boolean DEFAULT false,
	"is_endangered" boolean DEFAULT false,
	"is_protected" boolean DEFAULT false,
	"wildlife_value" text,
	"pollinator_friendly" boolean DEFAULT false,
	"carbon_sequestration" text,
	"erosion_control" boolean DEFAULT false,
	"windbreak_suitability" boolean DEFAULT false,
	"best_planting_months" integer[] DEFAULT '{}',
	"propagation_method" text[] DEFAULT '{}',
	"seed_treatment" text,
	"planting_spacing" double precision,
	"companion_species" text[] DEFAULT '{}',
	"description" text,
	"image" text,
	"additional_images" text[] DEFAULT '{}',
	"gbif_id" text,
	"iucn_id" text,
	"wikipedia_url" text,
	"data_quality" text DEFAULT 'pending',
	"verified_by_id" integer,
	"verified_at" timestamp with time zone,
	"data_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb,
	CONSTRAINT "scientific_species_uid_unique" UNIQUE("uid"),
	CONSTRAINT "scientific_species_scientific_name_unique" UNIQUE("scientific_name"),
	CONSTRAINT "mature_height_positive" CHECK (mature_height IS NULL OR mature_height > 0),
	CONSTRAINT "mature_width_positive" CHECK (mature_width IS NULL OR mature_width > 0),
	CONSTRAINT "lifespan_positive" CHECK (lifespan IS NULL OR lifespan > 0),
	CONSTRAINT "planting_spacing_positive" CHECK (planting_spacing IS NULL OR planting_spacing > 0),
	CONSTRAINT "valid_temperature_range" CHECK (temperature_minimum IS NULL OR temperature_maximum IS NULL OR temperature_minimum <= temperature_maximum),
	CONSTRAINT "valid_growth_rate" CHECK (growth_rate IS NULL OR growth_rate IN ('slow', 'moderate', 'fast')),
	CONSTRAINT "valid_light_requirement" CHECK (light_requirement IS NULL OR light_requirement IN ('full-sun', 'partial-shade', 'full-shade', 'adaptable')),
	CONSTRAINT "valid_water_requirement" CHECK (water_requirement IS NULL OR water_requirement IN ('low', 'moderate', 'high')),
	CONSTRAINT "valid_data_quality" CHECK (data_quality IN ('verified', 'pending', 'draft')),
	CONSTRAINT "valid_conservation_status" CHECK (conservation_status IS NULL OR conservation_status IN ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD')),
	CONSTRAINT "verified_has_verifier" CHECK (data_quality != 'verified' OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)),
	CONSTRAINT "native_not_invasive" CHECK (NOT (is_native = true AND is_invasive = true)),
	CONSTRAINT "valid_planting_months" CHECK (array_length(best_planting_months, 1) IS NULL OR (array_length(best_planting_months, 1) <= 12 AND best_planting_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]))
);
--> statement-breakpoint
CREATE TABLE "site" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" geometry(Geometry,4326),
	"area" double precision,
	"status" "site_status" DEFAULT 'planning',
	"soil_type" text,
	"elevation" double precision,
	"slope" double precision,
	"aspect" text,
	"water_access" boolean DEFAULT false,
	"accessibility" text,
	"planned_planting_date" timestamp with time zone,
	"actual_planting_date" timestamp with time zone,
	"expected_tree_count" integer,
	"image" text,
	"created_by_id" integer NOT NULL,
	"migrated_site" boolean DEFAULT false,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"metadata" jsonb,
	"original_geometry" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "site_uid_unique" UNIQUE("uid"),
	CONSTRAINT "area_positive" CHECK (area IS NULL OR area > 0),
	CONSTRAINT "elevation_range" CHECK (elevation IS NULL OR (elevation >= -500 AND elevation <= 9000)),
	CONSTRAINT "slope_range" CHECK (slope IS NULL OR (slope >= 0 AND slope <= 90)),
	CONSTRAINT "valid_aspect" CHECK (aspect IS NULL OR aspect IN ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')),
	CONSTRAINT "valid_accessibility" CHECK (accessibility IS NULL OR accessibility IN ('easy', 'moderate', 'difficult')),
	CONSTRAINT "valid_soil_type" CHECK (soil_type IS NULL OR soil_type IN ('clay', 'sand', 'loam', 'rocky', 'peat', 'mixed')),
	CONSTRAINT "expected_tree_count_positive" CHECK (expected_tree_count IS NULL OR expected_tree_count > 0),
	CONSTRAINT "actual_after_planned" CHECK (planned_planting_date IS NULL OR actual_planting_date IS NULL OR actual_planting_date >= planned_planting_date),
	CONSTRAINT "planted_site_has_date" CHECK (status != 'planted' OR actual_planting_date IS NOT NULL),
	CONSTRAINT "flagged_site_reason" CHECK (flag = false OR flag_reason IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "species_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"scientific_name" text NOT NULL,
	"common_name" text,
	"description" text,
	"request_reason" text NOT NULL,
	"family" text,
	"habitat" text,
	"native_region" text,
	"conservation_status" text,
	"gbif_id" text,
	"wikipedia_url" text,
	"source_url" text,
	"requested_by_id" integer NOT NULL,
	"project_id" integer,
	"urgency" text DEFAULT 'normal',
	"status" "species_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" integer,
	"reviewed_at" timestamp with time zone,
	"admin_notes" text,
	"rejection_reason" text,
	"created_species_id" integer,
	"duplicate_of_request_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "species_request_uid_unique" UNIQUE("uid"),
	CONSTRAINT "valid_urgency" CHECK (urgency IN ('low', 'normal', 'high')),
	CONSTRAINT "reviewed_status_has_reviewer" CHECK (status = 'pending' OR (reviewed_by_id IS NOT NULL AND reviewed_at IS NOT NULL)),
	CONSTRAINT "rejected_has_reason" CHECK (status != 'rejected' OR rejection_reason IS NOT NULL),
	CONSTRAINT "approved_has_species" CHECK (status != 'approved' OR created_species_id IS NOT NULL),
	CONSTRAINT "duplicate_has_reference" CHECK (duplicate_of_request_id IS NULL OR status = 'rejected'),
	CONSTRAINT "reviewed_at_after_created" CHECK (reviewed_at IS NULL OR reviewed_at >= created_at),
	CONSTRAINT "scientific_name_format" CHECK (scientific_name ~* '^[A-Z][a-z]+ [a-z]+( [a-z]+)*$')
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
	"intervention_id" integer NOT NULL,
	"intervention_species_id" integer NOT NULL,
	"species_name" text,
	"created_by_id" integer NOT NULL,
	"tag" text,
	"tree_type" "tree_enum" DEFAULT 'sample',
	"location" geometry(Geometry,4326),
	"altitude" numeric(8, 2),
	"accuracy" numeric(6, 2),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"current_height" double precision,
	"current_width" double precision,
	"current_health_score" integer,
	"status" "tree_status" DEFAULT 'alive' NOT NULL,
	"status_reason" text,
	"status_changed_at" timestamp with time zone,
	"planting_date" timestamp with time zone,
	"last_measurement_date" timestamp with time zone,
	"next_measurement_date" timestamp with time zone,
	"image" text,
	"remeasured" boolean DEFAULT false,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tree_hid_unique" UNIQUE("hid"),
	CONSTRAINT "tree_uid_unique" UNIQUE("uid"),
	CONSTRAINT "height_width_positive" CHECK ((current_height IS NULL OR current_height >= 0) AND (current_width IS NULL OR current_width >= 0)),
	CONSTRAINT "altitude_range" CHECK (altitude IS NULL OR (altitude >= -500 AND altitude <= 9000)),
	CONSTRAINT "accuracy_positive" CHECK (accuracy IS NULL OR accuracy >= 0),
	CONSTRAINT "health_score_range" CHECK (current_health_score IS NULL OR (current_health_score >= 0 AND current_health_score <= 100)),
	CONSTRAINT "dead_tree_has_reason" CHECK (status != 'dead' OR status_reason IS NOT NULL),
	CONSTRAINT "status_changed_at_logic" CHECK (status_changed_at IS NULL OR status_changed_at <= NOW()),
	CONSTRAINT "measurement_date_logic" CHECK (last_measurement_date IS NULL OR next_measurement_date IS NULL OR next_measurement_date > last_measurement_date)
);
--> statement-breakpoint
CREATE TABLE "tree_record" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"tree_id" integer NOT NULL,
	"recorded_by_id" integer NOT NULL,
	"record_type" "record_type" NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"height" double precision,
	"width" double precision,
	"health_score" integer,
	"vitality_score" integer,
	"previous_status" "tree_status",
	"new_status" "tree_status",
	"status_reason" text,
	"findings" text,
	"findings_severity" text,
	"notes" text,
	"priority_level" text,
	"weather_conditions" jsonb,
	"soil_conditions" jsonb,
	"pests_observed" jsonb,
	"diseases_observed" jsonb,
	"damage_observed" jsonb,
	"growth_rate" numeric(6, 3),
	"leaf_density" text,
	"fruiting_status" text,
	"surrounding_vegetation" text,
	"recommended_actions" jsonb,
	"image" text,
	"device_location" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tree_record_uid_unique" UNIQUE("uid"),
	CONSTRAINT "health_vitality_range" CHECK ((health_score IS NULL OR (health_score >= 0 AND health_score <= 100)) AND (vitality_score IS NULL OR (vitality_score >= 0 AND vitality_score <= 100))),
	CONSTRAINT "measurements_positive" CHECK ((height IS NULL OR height >= 0) AND (width IS NULL OR width >= 0)),
	CONSTRAINT "recorded_at_not_future" CHECK (recorded_at <= NOW()),
	CONSTRAINT "status_change_logic" CHECK ((previous_status IS NULL AND new_status IS NULL) OR (previous_status IS NOT NULL AND new_status IS NOT NULL)),
	CONSTRAINT "valid_severity" CHECK (findings_severity IS NULL OR findings_severity IN ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "valid_priority" CHECK (priority_level IS NULL OR priority_level IN ('low', 'normal', 'high', 'urgent'))
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"auth0_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"display_name" text NOT NULL,
	"primary_workspace_uid" text,
	"primary_project_uid" text,
	"image" text,
	"slug" text NOT NULL,
	"type" "user_type" DEFAULT 'individual',
	"country" char(3),
	"website" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"bio" text,
	"locale" text DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flag" boolean DEFAULT false,
	"flag_reason" jsonb,
	"deleted_at" timestamp with time zone,
	"migrated_at" timestamp with time zone,
	"existing_planet_user" boolean DEFAULT false,
	"workspace_role" "workspace_role" DEFAULT 'member',
	CONSTRAINT "user_uid_unique" UNIQUE("uid"),
	CONSTRAINT "user_auth0_id_unique" UNIQUE("auth0_id"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_slug_unique" UNIQUE("slug"),
	CONSTRAINT "email_format" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$')
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "workspace_type" NOT NULL,
	"description" text,
	"image" text,
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
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug"),
	CONSTRAINT "slug_format" CHECK (slug ~* '^[a-z0-9-]+$' AND length(slug) >= 3),
	CONSTRAINT "email_format" CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$')
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
	CONSTRAINT "workspace_member_uid_unique" UNIQUE("uid"),
	CONSTRAINT "unique_workspace_membership" UNIQUE("workspace_id","user_id"),
	CONSTRAINT "joined_after_invited" CHECK (invited_at IS NULL OR joined_at >= invited_at),
	CONSTRAINT "active_status_logic" CHECK (status != 'active' OR joined_at IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_invite" ADD CONSTRAINT "bulk_invite_discarded_by_id_user_id_fk" FOREIGN KEY ("discarded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_site_id_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_species" ADD CONSTRAINT "intervention_species_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_species" ADD CONSTRAINT "intervention_species_scientific_species_id_scientific_species_id_fk" FOREIGN KEY ("scientific_species_id") REFERENCES "public"."scientific_species"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration" ADD CONSTRAINT "migration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_log" ADD CONSTRAINT "migration_log_migration_id_migration_id_fk" FOREIGN KEY ("migration_id") REFERENCES "public"."migration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_discarded_by_id_user_id_fk" FOREIGN KEY ("discarded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_bulk_invite_id_bulk_invite_id_fk" FOREIGN KEY ("bulk_invite_id") REFERENCES "public"."bulk_invite"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_scientific_species_id_scientific_species_id_fk" FOREIGN KEY ("scientific_species_id") REFERENCES "public"."scientific_species"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scientific_species" ADD CONSTRAINT "scientific_species_verified_by_id_user_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_created_species_id_scientific_species_id_fk" FOREIGN KEY ("created_species_id") REFERENCES "public"."scientific_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_request" ADD CONSTRAINT "species_request_duplicate_of_request_id_species_request_id_fk" FOREIGN KEY ("duplicate_of_request_id") REFERENCES "public"."species_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey" ADD CONSTRAINT "survey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_intervention_id_intervention_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."intervention"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_intervention_species_id_intervention_species_id_fk" FOREIGN KEY ("intervention_species_id") REFERENCES "public"."intervention_species"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_tree_id_tree_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."tree"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_recorded_by_id_user_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_audit_idx" ON "audit_log" USING btree ("entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_activity_idx" ON "audit_log" USING btree ("user_id","occurred_at") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "audit_log_workspace_audit_idx" ON "audit_log" USING btree ("workspace_id","occurred_at") WHERE workspace_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "bulk_invite_project_active_idx" ON "bulk_invite" USING btree ("project_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "bulk_invite_token_active_idx" ON "bulk_invite" USING btree ("token","status") WHERE status = 'pending' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "image_entity_lookup_idx" ON "image" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "image_primary_idx" ON "image" USING btree ("entity_type","entity_id","is_primary") WHERE is_primary = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "intervention_project_date_range_idx" ON "intervention" USING btree ("project_id","intervention_start_date","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "intervention_project_type_status_idx" ON "intervention" USING btree ("project_id","type","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "intervention_location_gist_idx" ON "intervention" USING gist ("location");--> statement-breakpoint
CREATE INDEX "intervention_user_idx" ON "intervention" USING btree ("user_id","intervention_end_date") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "intervention_species_intervention_idx" ON "intervention_species" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "migration_id_idx" ON "migration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "migration_logs_idx" ON "migration_log" USING btree ("migration_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_active_idx" ON "notifications" USING btree ("user_id","is_read","is_archived") WHERE is_read = false AND is_archived = false;--> statement-breakpoint
CREATE INDEX "notifications_user_list_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_scheduled_processing_idx" ON "notifications" USING btree ("scheduled_for") WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;--> statement-breakpoint
CREATE INDEX "project_workspace_active_idx" ON "project" USING btree ("workspace_id","is_active","is_public");--> statement-breakpoint
CREATE INDEX "project_user_projects_idx" ON "project" USING btree ("created_by_id","is_active");--> statement-breakpoint
CREATE INDEX "project_location_gist_idx" ON "project" USING gist ("location");--> statement-breakpoint
CREATE INDEX "project_invite_project_status_idx" ON "project_invite" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "project_invite_token_active_idx" ON "project_invite" USING btree ("token","status") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "project_invite_inviter_idx" ON "project_invite" USING btree ("invited_by_id","created_at");--> statement-breakpoint
CREATE INDEX "project_members_active_idx" ON "project_member" USING btree ("project_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "project_members_user_active_idx" ON "project_member" USING btree ("user_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "scientific_species_id_Idx" ON "project_species" USING btree ("scientific_species_id");--> statement-breakpoint
CREATE INDEX "species_scientific_name_idx" ON "scientific_species" USING btree ("scientific_name");--> statement-breakpoint
CREATE INDEX "species_common_name_idx" ON "scientific_species" USING btree ("common_name");--> statement-breakpoint
CREATE INDEX "species_family_genus_idx" ON "scientific_species" USING btree ("family","genus");--> statement-breakpoint
CREATE INDEX "species_habitat_climate_idx" ON "scientific_species" USING gin ("habitat","climate_zones");--> statement-breakpoint
CREATE INDEX "species_soil_drainage_idx" ON "scientific_species" USING btree ("soil_types","drainage_preference");--> statement-breakpoint
CREATE INDEX "species_conservation_native_idx" ON "scientific_species" USING btree ("conservation_status","is_native","is_endangered");--> statement-breakpoint
CREATE INDEX "species_growth_size_idx" ON "scientific_species" USING btree ("growth_rate","mature_height","lifespan");--> statement-breakpoint
CREATE INDEX "site_project_active_idx" ON "site" USING btree ("project_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "site_location_gist_idx" ON "site" USING gist ("location");--> statement-breakpoint
CREATE INDEX "site_created_by_idx" ON "site" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "species_request_review_queue_idx" ON "species_request" USING btree ("status","urgency","created_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "species_request_user_idx" ON "species_request" USING btree ("requested_by_id","status","created_at");--> statement-breakpoint
CREATE INDEX "species_request_project_idx" ON "species_request" USING btree ("project_id","status") WHERE project_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "species_request_duplicate_idx" ON "species_request" USING btree ("scientific_name","status") WHERE status IN ('pending', 'approved');--> statement-breakpoint
CREATE INDEX "survey_user_idx" ON "survey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tree_intervention_remeasured_idx" ON "tree" USING btree ("intervention_id","remeasured");--> statement-breakpoint
CREATE INDEX "tree_intervention_status_idx" ON "tree" USING btree ("intervention_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "tree_species_idx" ON "tree" USING btree ("intervention_species_id","status");--> statement-breakpoint
CREATE INDEX "tree_measurement_schedule_idx" ON "tree" USING btree ("next_measurement_date","status") WHERE next_measurement_date IS NOT NULL AND status = 'alive' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "tree_health_monitoring_idx" ON "tree" USING btree ("current_health_score","last_measurement_date") WHERE current_health_score IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "tree_record_latest_idx" ON "tree_record" USING btree ("tree_id","recorded_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "tree_record_priority_idx" ON "tree_record" USING btree ("priority_level","recorded_at") WHERE priority_level IN ('high', 'urgent') AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "tree_record_health_trends_idx" ON "tree_record" USING btree ("tree_id","health_score","recorded_at") WHERE health_score IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "workspace_created_by_idx" ON "workspace" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_idx" ON "workspace_member" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_member" USING btree ("user_id");