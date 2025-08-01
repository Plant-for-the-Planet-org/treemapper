import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  uuid,
  boolean,
  unique,
  jsonb,
  doublePrecision,
  decimal,
  serial,
  index,
  uniqueIndex,
  bigint,
  char,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

interface GeoJSONGeometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon';
  coordinates: number[] | number[][] | number[][][];
}

export type FlagLevel = 'high' | 'medium' | 'low';
export type FlagType = 'error' | 'warning' | 'info';

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'soft_delete',
  'restore',
  'login',
  'logout',
  'invite',
  'accept_invite',
  'decline_invite',
  'role_change',
  'permission_change',
  'export',
  'import',
  'archive',
  'unarchive',
  'impersonation'
]);

export const auditEntityEnum = pgEnum('audit_entity', [
  'user',
  'workspace',
  'workspace_member',
  'project',
  'project_member',
  'site',
  'intervention',
  'tree',
  'tree_record',
  'scientific_species',
  'project_species',
  'species_request',
  'project_invite',
  'bulk_invite',
  'image',
  'notification',
  'migration'
]);


export interface FlagReasonEntry {
  uid: string;
  type: FlagType;
  level: FlagLevel;
  title: string;
  message: string;
  updatedAt: Date;
  createdAt: Date
}

export interface InterventionSpeciesEntry {
  uid: string;
  scientificSpeciesId?: number;
  scientificSpeciesUid?: string;
  speciesName?: string;
  isUnknown: boolean;
  otherSpeciesName?: string;
  count: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}



export const userTypeEnum = pgEnum('user_type', ['individual', 'tpo', "organization", 'other', "school", "superadmin"]);
export const workspaceTypeEnum = pgEnum('workspace_type', ['platform', "private", 'development', 'premium']);

export const logLevelEnum = pgEnum('log_level', [
  'debug',
  'info',
  'warning',
  'error',
  'fatal'
]);
export const entityEnum = pgEnum('entity_type', [
  'users',
  'projects',
  'interventions',
  'species',
  'sites',
  'images'
]);
export const projectRoleEnum = pgEnum('project_role', ['owner', 'admin', 'contributor', 'observer']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'declined', 'expired', 'discarded']);
export const imageUploadDeviceEnum = pgEnum('image_upload_device', ['web', 'mobile']);
export const siteStatusEnum = pgEnum('site_status', ['planted', 'planting', 'barren', 'reforestation']);
export const siteAccessEnum = pgEnum('site_access', ['all_sites', 'deny_all', 'read_only', 'limited_access']);
export const speciesRequestStatusEnum = pgEnum('species_request_status', ['pending', 'approved', 'rejected']);
export const interventionDiscriminatorEnum = pgEnum('intervention_discriminator', ['plot', 'intervention']);
export const captureModeEnum = pgEnum('capture_mode', ['on-site', 'off-site', 'external', 'unknown']);
export const captureStatusEnum = pgEnum('capture_status', ['complete', 'partial', 'incomplete']);
export const notificationTypeEnum = pgEnum('notification_type', ['project', 'site', 'member', 'intervention', 'tree', 'species', 'user', 'invite', 'system', 'other']);
export const workspaceRoleEnum = pgEnum('workspace_role', [
  'owner',
  'admin',
  'member'
]);
export const memberStatusEnum = pgEnum('member_status', [
  'active',
  'inactive',
  'suspended',
  'pending'
]);


export const interventionTypeEnum = pgEnum('intervention_type', [
  'assisting-seed-rain',
  'control-livestock',
  'direct-seeding',
  'enrichment-planting',
  'fencing',
  'fire-patrol',
  'fire-suppression',
  'firebreaks',
  'generic-tree-registration',
  'grass-suppression',
  'liberating-regenerant',
  'maintenance',
  'marking-regenerant',
  'multi-tree-registration',
  'other-intervention',
  'plot-plant-registration',
  'removal-invasive-species',
  'sample-tree-registration',
  'single-tree-registration',
  'soil-improvement',
  'stop-tree-harvesting',
]);
export const treeStatusEnum = pgEnum('tree_status', ['alive', 'dead', 'unknown', 'removed', 'sick']);
export const recordTypeEnum = pgEnum('record_type', [
  'planting',
  'measurement',
  'status_change',
  'inspection',
  'maintenance',
  'death',
  'removal',
  'health_assessment',
  'growth_monitoring'
]);

export const imageEntityEnum = pgEnum('image_entity', ['project', 'site', 'user', 'intervention', 'tree']);
export const treeTypeEnum = pgEnum('tree_enum', ['single', 'sample', 'plot']);
export const imageTypeEnum = pgEnum('image_type', ['before', 'during', 'after', 'detail', 'overview', 'progress', 'aerial', 'ground', 'record']);
export const interventionStatusEnum = pgEnum('intervention_status', ['planned', 'active', 'completed', 'failed', 'on-hold', 'cancelled']);
export const migrationStatusEnum = pgEnum('migration_status', [
  'in_progress', 'completed', 'failed', 'started'
]);





const geometryWithGeoJSON = (srid?: number) =>
  customType<{
    data: GeoJSONGeometry
    driverData: string;
  }>({
    dataType() {
      return srid ? `geometry(Geometry,${srid})` : 'geometry';
    },
    toDriver(value: any): string {
      if (typeof value === 'object') {
        return `ST_GeomFromGeoJSON('${JSON.stringify(value)}')`;
      }
      return `ST_GeomFromText('${value}')`;
    },
    fromDriver(value: string): any {
      return value;
    },
  });





export const migration = pgTable('migration', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  planetId: text('planet_id').notNull().unique(),
  status: migrationStatusEnum('status').default('in_progress').notNull(),
  migratedEntities: jsonb('migrated_entities').$type<{
    user: boolean;
    projects: boolean;
    sites: boolean;
    species: boolean;
    interventions: boolean;
    images: boolean;
  }>().default({
    "user": false,
    "projects": false,
    "sites": false,
    "species": false,
    "interventions": false,
    "images": false,
  }),
  migrationCompletedAt: timestamp('migration_completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  migrationVersion: text('migration_version').default('1.0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
}, (table) => ({
  migrationIdIdx: index('migration_id_idx').on(table.userId)
}))

export const migrationLog = pgTable('migration_log', {
  id: serial('id').primaryKey(),
  migrationId: integer('migration_id').notNull().references(() => migration.id, { onDelete: 'cascade' }),
  uid: text('uid').notNull(),
  level: logLevelEnum('level').notNull(),
  message: text('message').notNull(),
  entity: entityEnum('entity'),
  entityId: text('entity_id'),
  stackTrace: text('stack_trace'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  migrationLogsIdx: index('migration_logs_idx').on(table.migrationId)
}))

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  auth0Id: text('auth0_id').notNull().unique(),
  email: text('email').notNull().unique(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  displayName: text('display_name').notNull(),
  primaryWorkspace: text('primary_workspace').references(() => workspace.uid),
  primaryProject: text('primary_project').references(() => project.uid),
  image: text('image'),
  slug: text('slug').unique().notNull(),
  type: userTypeEnum('type').default('individual'),
  country: char('country', { length: 3 }),
  website: text('url'),
  isPrivate: boolean('is_private').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow(),
  bio: text('bio'),
  locale: text('locale').default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  migratedAt: timestamp('migrated_at', { withTimezone: true }),
  existingPlanetUser: boolean('existing_planet_user').default(false),
  workspace: workspaceRoleEnum('role').notNull().default('member'),
  impersonate: text('impersonate')
}, (table) => ({
  emailFormat: check('email_format', sql`email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  slugFormat: check('slug_format', sql`slug ~* '^[a-z0-9-]+$' AND length(slug) >= 3`),
}));

export const workspace = pgTable('workspace', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: workspaceTypeEnum('type').notNull(),
  description: text('description'),
  image: text('logo'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdById: integer('created_by_id').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
}, (table) => ({
  nameIdx: index('workspace_name_idx').on(table.name),
  slugIdx: index('workspace_slug_idx').on(table.slug),
  typeIdx: index('workspace_type_idx').on(table.type),
  createdByIdx: index('workspace_created_by_idx').on(table.createdById),
}));

export const workspaceMember = pgTable('workspace_member', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  workspaceId: integer('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: workspaceRoleEnum('role').notNull().default('member'),
  status: memberStatusEnum('status').default('active'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  invitedById: integer('invited_by_id').references(() => user.id, { onDelete: 'cascade' }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => ({
  workspaceIdx: index('workspace_members_idx').on(table.workspaceId),
  userIdx: index('workspace_members_user_idx').on(table.userId),
}));

export const survey = pgTable('survey', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').notNull().default(false),
  organizationName: text("organizationName"),
  primaryGoal: text("primary_goal"),
  role: text("role"),
  requestedDemo: boolean('requested_demo').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('survey_user_idx').on(table.userId),
}));

export const image = pgTable('image', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  type: imageTypeEnum('type').notNull().default('overview'),
  entityId: integer('entity_id').notNull(),
  entityType: imageEntityEnum('entity_type').notNull(),
  filename: text('filename'),
  originalName: text('original_name'),
  mimeType: text('mime_type'),
  size: bigint('size', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  notes: text('notes'),
  deviceType: imageUploadDeviceEnum('device_type').notNull(),
  isPrimary: boolean('is_primary').default(false),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  entityId: index('entityId_images__id_idx').on(table.entityId),
  sizePositive: check('size_positive', sql`size IS NULL OR size > 0`),
  dimensionsPositive: check('dimensions_positive', sql`(width IS NULL OR width > 0) AND (height IS NULL OR height > 0)`),
  reasonableFileSize: check('reasonable_file_size', sql`size IS NULL OR size <= 104857600`), // 100MB limit
}));

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull().default('other'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  entityId: integer('entity_id'),
  priority: text('priority').default('normal'),
  category: text('category'),
  isRead: boolean('is_read').default(false).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  actionUrl: text('action_url'),
  actionText: text('action_text'),
  scheduledFor: timestamp('scheduled_for'),
  expiresAt: timestamp('expires_at'),
  deliveryMethod: text('delivery_method'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  typeIdx: index('notifications_type_idx').on(table.type),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  isArchivedIdx: index('notifications_is_archived_idx').on(table.isArchived),
  priorityIdx: index('notifications_priority_idx').on(table.priority),
  scheduledForIdx: index('notifications_scheduled_for_idx').on(table.scheduledFor),
  expiresAtIdx: index('notifications_expires_at_idx').on(table.expiresAt),
  userUnreadIdx: index('notifications_user_unread_idx').on(table.userId, table.isRead),
  userCategoryIdx: index('notifications_user_category_idx').on(table.userId, table.category),
  unreadNotificationsIdx: index('notifications_unread_idx').on(table.userId).where(sql`is_read = false AND is_archived = false`),
}));


export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  action: auditActionEnum('action').notNull(),
  entityType: auditEntityEnum('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  entityUid: text('entity_uid'),
  userId: integer('user_id').references(() => user.id, { onDelete: 'set null' }),
  workspaceId: integer('workspace_id').references(() => workspace.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'set null' }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  description: text('description'),
  source: text('source').default('web'), // 'web', 'mobile', 'api', 'system', 'migration'
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  sessionId: text('session_id'),
  requestId: text('request_id'),
  reason: text('reason'),
  metadata: jsonb('metadata'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  entityIdx: index('audit_log_entity_idx').on(table.entityType, table.entityId),
  userIdx: index('audit_log_user_idx').on(table.userId),
  workspaceIdx: index('audit_log_workspace_idx').on(table.workspaceId),
  projectIdx: index('audit_log_project_idx').on(table.projectId),
  actionIdx: index('audit_log_action_idx').on(table.action),
  occurredAtIdx: index('audit_log_occurred_at_idx').on(table.occurredAt),

  // Composite indexes for common queries
  entityTimeIdx: index('audit_log_entity_time_idx').on(table.entityType, table.entityId, table.occurredAt),
  userTimeIdx: index('audit_log_user_time_idx').on(table.userId, table.occurredAt),
  workspaceTimeIdx: index('audit_log_workspace_time_idx').on(table.workspaceId, table.occurredAt),

  // JSONB indexes for change tracking
  changedFieldsIdx: index('audit_log_changed_fields_gin_idx').using('gin', table.changedFields),
  oldValuesIdx: index('audit_log_old_values_gin_idx').using('gin', table.oldValues),
  newValuesIdx: index('audit_log_new_values_gin_idx').using('gin', table.newValues),
}));



export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  workspaceId: integer('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  purpose: text('purpose'),
  projectName: text('project_name').notNull(),
  projectType: text('project_type'),
  ecosystem: text('ecosystem'),
  projectScale: text('project_scale'),
  target: integer('target'),
  projectWebsite: text('project_website'),
  description: text('description'),
  classification: text('classification'),
  image: text('image'),
  videoUrl: text('video_url'),
  country: char('country', { length: 3 }),
  location: geometryWithGeoJSON(4326)('location'),
  originalGeometry: jsonb('original_geometry'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  url: text('url'),
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').default(true).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  isPersonal: boolean('is_personal').default(false).notNull(),
  intensity: text('intensity'),
  revisionPeriodicityLevel: text('revision_periodicity_level'),
  metadata: jsonb('metadata'),
  migratedProject: boolean('migrated_project').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
}, (table) => ({
  locationIdx: index('projects_location_gist_idx').using('gist', table.location),
  createdByIdIdx: index('project_created_by_id_idx').on(table.createdById),
  workspaceIdx: index('projects_workpsace_by_idx').on(table.workspaceId),
  targetPositive: check('target_positive', sql`target IS NULL OR target > 0`),
  latitudeRange: check('latitude_range', sql`latitude IS NULL OR (latitude >= -90 AND latitude <= 90)`),
  longitudeRange: check('longitude_range', sql`longitude IS NULL OR (longitude >= -180 AND longitude <= 180)`),
}));

export const projectMember = pgTable('project_member', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id),
  userId: integer('user_id').notNull().references(() => user.id),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  bulkInviteId: integer('bulk_invite_id').references(() => bulkInvite.id),
  siteAccess: siteAccessEnum('site_access').default('all_sites').notNull(),
  restrictedSites: text('restricted_sites').array().default([]),
}, (table) => ({
  uniqueMember: unique('unique_project_member').on(table.projectId, table.userId),
  projectIdIdx: index('project_members_project_idx').on(table.projectId),
  userIdIdx: index('project_members_user_idx').on(table.userId),
  projectRoleIdx: index('project_members_role_idx').on(table.projectRole),
}));

export const bulkInvite = pgTable('bulk_invite', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id),
  restriction: text('restriction').array().default([]),
  message: text('message'),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedById: integer('invited_by_id').notNull().references(() => user.id),
  discardedBy: integer('discarded_by').references(() => user.id),
  status: inviteStatusEnum('status').notNull().default('pending'),
  token: uuid('token').defaultRandom().notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  projectBulkIdIdx: index('project_bulk_invites_project_idx').on(table.projectId),
  deletedAtIdx: index('project_bulk_invites_deleted_at_idx').on(table.deletedAt),
}));


export const site = pgTable('site', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  location: geometryWithGeoJSON(4326)('location'),
  originalGeometry: jsonb('original_geometry'),
  latitude: doublePrecision('latitude'),
  image: text('image'),
  longitude: doublePrecision('longitude'),
  area: doublePrecision('area'),
  status: siteStatusEnum('status').default('planting'),
  createdById: integer('created_by_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  migratedSite: boolean('migrated_site').default(false),
}, (table) => ({
  projectIdIdx: index('sites_project_id_idx').on(table.projectId),
  locationIdx: index('sites_location_gist_idx').using('gist', table.location),
  areaPositive: check('area_positive', sql`area IS NULL OR area > 0`),
  latitudeRange: check('latitude_range', sql`latitude IS NULL OR (latitude >= -90 AND latitude <= 90)`),
  longitudeRange: check('longitude_range', sql`longitude IS NULL OR (longitude >= -180 AND longitude <= 180)`),
}));


export const projectInvites = pgTable('project_invite', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  message: text('message'),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedById: integer('invited_by_id').notNull().references(() => user.id),
  discardedBy: integer('discarded_by').references(() => user.id),
  status: inviteStatusEnum('status').notNull().default('pending'),
  token: uuid('token').defaultRandom().notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  projectIdIdx: index('project_invites_project_idx').on(table.projectId),
  emailIdx: index('project_invites_email_idx').on(table.email),
  projectStatusIdx: index('project_invites_project_status_idx').on(table.projectId, table.status),
  acceptedBeforeExpiry: check('accepted_before_expiry', sql`accepted_at IS NULL OR accepted_at <= expires_at`),
  expiresInFuture: check('expires_in_future', sql`expires_at > created_at`),
}));


export const scientificSpecies = pgTable('scientific_species', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  scientificName: text('scientific_name').notNull().unique(),
  commonName: text('common_name'),
  family: text('family'),
  genus: text('genus'),
  description: text('description'),
  image: text('image'),
  gbifId: text('gbif_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
}, (table) => ({
  scientificNameIdx: index('scientific_species_name_idx').on(table.scientificName),
  uidIdx: index('scientific_species_uid_idx').on(table.uid),
}));


export const projectSpecies = pgTable('project_species', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  scientificSpeciesId: integer('scientific_species_id').notNull().references(() => scientificSpecies.id),
  scientificSpeciesUid: text('scientific_species_uid'),
  isUnknown: boolean('is_unknown').default(false).notNull(),
  speciesName: text('species_name'),
  isNativeSpecies: boolean('is_native_species').default(false),
  isEndangered: boolean('is_endangered').default(false),
  isDisabled: boolean('is_disabled').default(false),
  projectId: integer('project_id').notNull().references(() => project.id),
  addedById: integer('added_by_id').notNull().references(() => user.id),
  commonName: text('common_name'),
  image: text('image'),
  description: text('description'),
  notes: text('notes'),
  favourite: boolean('favourite').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
}, (table) => ({
  uniqueProjectSpecies: uniqueIndex('unique_project_species').on(table.projectId, table.scientificSpeciesId),
  scientificSpeciesIdx: index('project_species_scientific_species_idx').on(table.scientificSpeciesId),
  projectIdx: index('project_species_projects_idx').on(table.projectId),
  addedByIdx: index('project_species_added_by_idx').on(table.addedById),
  nativeSpeciesIdx: index('project_species_native_idx').on(table.isNativeSpecies),
}));


export const speciesRequest = pgTable('species_request', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  scientificName: text('scientific_name').notNull(),
  commonName: text('common_name'),
  description: text('description'),
  requestReason: text('request_reason'),
  gbifId: text('gbif_id'),
  requestedById: integer('requested_by_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id),
  status: speciesRequestStatusEnum('status').notNull().default('pending'),
  reviewedById: integer('reviewed_by_id').references(() => user.id),
  adminNotes: text('admin_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  requestedByIdx: index('species_requests_requested_by_idx').on(table.requestedById)
}));

export const intervention = pgTable('intervention', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  hid: text('hid').notNull().unique(),
  discr: interventionDiscriminatorEnum('discr').notNull().default('intervention'),
  userId: integer('user_id').notNull().references(() => user.id),
  projectId: integer('project_id').notNull().references(() => project.id),
  projectSiteId: integer('project_site_id').references(() => site.id),
  parentInterventionId: integer('parent_intervention_id').references(() => intervention.id),
  type: interventionTypeEnum('type').notNull(),
  idempotencyKey: text('idempotency_key').unique().notNull(),
  captureMode: captureModeEnum('capture_mode').notNull().default('unknown'),
  captureStatus: captureStatusEnum('capture_status').notNull().default('complete'),
  registrationDate: timestamp('registration_date', { withTimezone: true }).notNull(),
  interventionStartDate: timestamp('intervention_start_date', { withTimezone: true }).notNull(),
  interventionEndDate: timestamp('intervention_end_date', { withTimezone: true }).notNull(),
  location: geometryWithGeoJSON(4326)('location'),
  originalGeometry: jsonb('original_geometry'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  area: doublePrecision('area'),
  deviceLocation: jsonb('device_location'),
  treeCount: integer('tree_count').default(0),
  sampleTreeCount: integer('sample_tree_count').default(0),
  interventionStatus: interventionStatusEnum('intervention_status').default('active'),
  description: text('description'),
  image: text('image'),
  isPrivate: boolean('is_private').default(false).notNull(),
  species: jsonb('species').$type<InterventionSpeciesEntry[]>().default([]),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  hasRecords: boolean('has_records').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  migratedIntervention: boolean('migrated_intervention').default(false),
}, (table) => ({
  projectIdx: index('interventions_project_idx').on(table.projectId),
  projectSiteIdx: index('interventions_project_site_idx').on(table.projectSiteId),
  parentIdx: index('parent_idx').on(table.uid),
  userIdx: index('interventions_user_idx').on(table.userId),
  typeIdx: index('interventions_type_idx').on(table.type),
  speciesGinIdx: index('interventions_species_gin_idx').using('gin', table.species),
  interventionStartDateIdx: index('interventions_start_date_idx').on(table.interventionStartDate),
  projectDateRangeIdx: index('interventions_project_date_range_idx').on(table.projectId, table.interventionStartDate),
  areaPositive: check('area_positive', sql`area IS NULL OR area >= 0`),
  treeCountNonNegative: check('tree_count_non_negative', sql`tree_count >= 0`),
  sampleTreeCountNonNegative: check('sample_tree_count_non_negative', sql`sample_tree_count >= 0`),
  validDateRange: check('valid_date_range', sql`intervention_start_date <= intervention_end_date`),
}));

export const tree = pgTable('tree', {
  id: serial('id').primaryKey(),
  hid: text('hid').notNull().unique(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').references(() => intervention.id),
  interventionSpeciesId: text('intervention_species_id'),
  speciesName: text('species_name'),
  isUnknown: boolean('is_unknown').default(false),
  createdById: integer('created_by_id').notNull().references(() => user.id),
  tag: text('tag'),
  treeType: treeTypeEnum('tree_type').default('sample'),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }),
  location: geometryWithGeoJSON(4326)('location'),
  originalGeometry: jsonb('original_geometry'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  height: doublePrecision('height'),
  width: doublePrecision('width'),
  status: treeStatusEnum('status').default('alive').notNull(),
  statusReason: text('status_reason'),
  plantingDate: timestamp('planting_date', { withTimezone: true }),
  lastMeasurementDate: timestamp('last_measurement_date', { withTimezone: true }),
  nextMeasurementDate: timestamp('next_measurement_date', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
}, (table) => ({
  interventionIdx: index('trees_intervention_idx').on(table.interventionId),
  createdByIdx: index('trees_created_by_idx').on(table.createdById),
  statusIdx: index('trees_status_idx').on(table.status),
  typeIdx: index('trees_type_idx').on(table.treeType),
  plantingDateIdx: index('trees_planting_date_idx').on(table.plantingDate),
  lastMeasurementIdx: index('trees_last_measurement_idx').on(table.lastMeasurementDate),
  locationIdx: index('trees_location_gist_idx').using('gist', table.location),
  heightPositive: check('height_positive', sql`height IS NULL OR height >= 0`),
  widthPositive: check('width_positive', sql`width IS NULL OR width >= 0`),
  altitudeRange: check('altitude_range', sql`altitude IS NULL OR (altitude >= -500 AND altitude <= 9000)`), // meters
  accuracyPositive: check('accuracy_positive', sql`accuracy IS NULL OR accuracy >= 0`),
}));

export const treeRecord = pgTable('tree_record', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  treeId: integer('tree_id').notNull().references(() => tree.id, { onDelete: 'cascade' }),
  recordedById: integer('recorded_by_id').notNull().references(() => user.id),
  recordType: recordTypeEnum('record_type').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  image: text('image'),
  height: doublePrecision('height'),
  width: doublePrecision('width'),
  healthScore: integer('health_score'),
  vitalityScore: integer('vitality_score'),
  structuralIntegrity: text('structural_integrity'),
  previousStatus: treeStatusEnum('previous_status'),
  newStatus: treeStatusEnum('new_status'),
  statusReason: text('status_reason'),
  findings: text('findings'),
  findingsSeverity: text('findings_severity'), // Low, Medium, High, Critical
  findingsComments: text('findings_comments'),
  notes: text('notes'),
  weatherConditions: jsonb('weather_conditions'),
  soilConditions: jsonb('soil_conditions'),
  surroundingVegetation: text('surrounding_vegetation'),
  pestsObserved: jsonb('pests_observed'),
  diseasesObserved: jsonb('diseases_observed'),
  damageObserved: jsonb('damage_observed'),
  growthRate: decimal('growth_rate', { precision: 6, scale: 3 }),
  leafDensity: text('leaf_density'),
  fruitingStatus: text('fruiting_status'),
  recommendedActions: jsonb('recommended_actions'),
  priorityLevel: text('priority_level'),
  isPublic: boolean('is_public').default(true).notNull(),
  deviceLocation: jsonb('device_location'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  treeIdIdx: index('tree_records_tree_id_idx').on(table.treeId),
  recordedByIdx: index('tree_records_recorded_by_idx').on(table.recordedById),
  healthScoreRange: check('health_score_range', sql`health_score IS NULL OR (health_score >= 0 AND health_score <= 100)`),
  vitalityScoreRange: check('vitality_score_range', sql`vitality_score IS NULL OR (vitality_score >= 0 AND vitality_score <= 100)`),
  heightPositive: check('height_positive', sql`height IS NULL OR height >= 0`),
  widthPositive: check('width_positive', sql`width IS NULL OR width >= 0`),
  recordedAtNotFuture: check('recorded_at_not_future', sql`recorded_at <= NOW()`),
}));
export const userRelations = relations(user, ({ one, many }) => ({
  projectMemberships: many(projectMember),
  createdProjects: many(project, { relationName: 'createdBy' }),
  addedProjectSpecies: many(projectSpecies, { relationName: 'addedBy' }),
  createdSites: many(site, { relationName: 'createdBy' }),
  createdTrees: many(tree, { relationName: 'createdBy' }),
  recordedTreeRecords: many(treeRecord, { relationName: 'recordedBy' }),
  sentProjectInvites: many(projectInvites, { relationName: 'invitedBy' }),
  bulkInvites: many(bulkInvite, { relationName: 'invitedBy' }),
  interventions: many(intervention, { relationName: 'userInterventions' }),
  notifications: many(notifications),
  migrations: many(migration),
  primaryWorkspace: one(workspace, {
    fields: [user.primaryWorkspace],
    references: [workspace.uid],
  }),
  primaryProject: one(project, {
    fields: [user.primaryProject],
    references: [project.uid],
  }),
  speciesRequests: many(speciesRequest, { relationName: 'requestedBy' }),
  reviewedSpeciesRequests: many(speciesRequest, { relationName: 'reviewedBy' }),
  workspaceMemberships: many(workspaceMember),
  createdWorkspaces: many(workspace, { relationName: 'createdBy' }),
  sentWorkspaceInvites: many(workspaceMember, { relationName: 'invitedBy' }),
  surveys: many(survey),
}));

export const surveyRelations = relations(survey, ({ one }) => ({
  user: one(user, {
    fields: [survey.userId],
    references: [user.id],
  }),
}));

export const migrationRelations = relations(migration, ({ one, many }) => ({
  user: one(user, {
    fields: [migration.userId],
    references: [user.id],
  }),
  logs: many(migrationLog),
}));

export const migrationLogRelations = relations(migrationLog, ({ one }) => ({
  migration: one(migration, {
    fields: [migrationLog.migrationId],
    references: [migration.id],
  }),
}));

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [workspace.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  members: many(workspaceMember),
  projects: many(project),
}));

export const workspaceMemberRelations = relations(workspaceMember, ({ one }) => ({
  workspace: one(workspace, {
    fields: [workspaceMember.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [workspaceMember.userId],
    references: [user.id],
  }),
  invitedBy: one(user, {
    fields: [workspaceMember.invitedById],
    references: [user.id],
    relationName: 'invitedBy',
  }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [project.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
  members: many(projectMember),
  invites: many(projectInvites),
  bulkInvites: many(bulkInvite),
  sites: many(site),
  interventions: many(intervention),
  projectSpecies: many(projectSpecies),
  speciesRequests: many(speciesRequest),
}));

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
  bulkInvite: one(bulkInvite, {
    fields: [projectMember.bulkInviteId],
    references: [bulkInvite.id],
  }),
}));

export const projectInviteRelations = relations(projectInvites, ({ one }) => ({
  project: one(project, {
    fields: [projectInvites.projectId],
    references: [project.id],
  }),
  invitedBy: one(user, {
    fields: [projectInvites.invitedById],
    references: [user.id],
    relationName: 'invitedBy',
  }),
  discardedBy: one(user, {
    fields: [projectInvites.discardedBy],
    references: [user.id],
  }),
}));

export const bulkInviteRelations = relations(bulkInvite, ({ one, many }) => ({
  project: one(project, {
    fields: [bulkInvite.projectId],
    references: [project.id],
  }),
  invitedBy: one(user, {
    fields: [bulkInvite.invitedById],
    references: [user.id],
    relationName: 'invitedBy',
  }),
  discardedBy: one(user, {
    fields: [bulkInvite.discardedBy],
    references: [user.id],
  }),
  members: many(projectMember),
}));

export const scientificSpeciesRelations = relations(scientificSpecies, ({ many }) => ({
  projectSpecies: many(projectSpecies),
}));

export const projectSpeciesRelations = relations(projectSpecies, ({ one }) => ({
  project: one(project, {
    fields: [projectSpecies.projectId],
    references: [project.id],
  }),
  addedBy: one(user, {
    fields: [projectSpecies.addedById],
    references: [user.id],
    relationName: 'addedBy',
  }),
  scientificSpecies: one(scientificSpecies, {
    fields: [projectSpecies.scientificSpeciesId],
    references: [scientificSpecies.id],
  }),
}));

export const speciesRequestRelations = relations(speciesRequest, ({ one }) => ({
  requestedBy: one(user, {
    fields: [speciesRequest.requestedById],
    references: [user.id],
    relationName: 'requestedBy',
  }),
  reviewedBy: one(user, {
    fields: [speciesRequest.reviewedById],
    references: [user.id],
    relationName: 'reviewedBy',
  }),
  project: one(project, {
    fields: [speciesRequest.projectId],
    references: [project.id],
  }),
}));

export const siteRelations = relations(site, ({ one, many }) => ({
  project: one(project, {
    fields: [site.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [site.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  interventions: many(intervention),
}));

export const interventionRelations = relations(intervention, ({ one, many }) => ({
  project: one(project, {
    fields: [intervention.projectId],
    references: [project.id],
  }),
  projectSite: one(site, {
    fields: [intervention.projectSiteId],
    references: [site.id],
  }),
  user: one(user, {
    fields: [intervention.userId],
    references: [user.id],
    relationName: 'userInterventions',
  }),
  parentIntervention: one(intervention, {
    fields: [intervention.parentInterventionId],
    references: [intervention.id],
    relationName: 'parentIntervention',
  }),
  childInterventions: many(intervention, { relationName: 'parentIntervention' }),
  trees: many(tree),
}));

export const treeRelations = relations(tree, ({ one, many }) => ({
  intervention: one(intervention, {
    fields: [tree.interventionId],
    references: [intervention.id],
  }),
  createdBy: one(user, {
    fields: [tree.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  records: many(treeRecord),
}));

export const treeRecordRelations = relations(treeRecord, ({ one }) => ({
  tree: one(tree, {
    fields: [treeRecord.treeId],
    references: [tree.id],
  }),
  recordedBy: one(user, {
    fields: [treeRecord.recordedById],
    references: [user.id],
    relationName: 'recordedBy',
  }),
}));

export const imageRelations = relations(image, ({ one }) => ({
  // Note: entityId is generic, so no direct relation possible
  // You'll need to handle this in your service layer based on entityType
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [auditLog.workspaceId],
    references: [workspace.id],
  }),
  project: one(project, {
    fields: [auditLog.projectId],
    references: [project.id],
  }),
}));