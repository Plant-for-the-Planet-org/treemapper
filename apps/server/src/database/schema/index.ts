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
export const siteStatusEnum = pgEnum('site_status', ['planted', 'planting', 'barren', 'reforestation', 'planning']);
export const siteAccessEnum = pgEnum('site_access', ['all_sites', 'deny_all', 'read_only', 'limited_access']);
export const speciesRequestStatusEnum = pgEnum('species_request_status', ['pending', 'approved', 'rejected']);
export const interventionDiscriminatorEnum = pgEnum('intervention_discriminator', ['plot', 'intervention']);
export const captureModeEnum = pgEnum('capture_mode', ['on-site', 'off-site', 'external', 'unknown', 'web-upload']);
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
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: text('display_name').notNull(),
  primaryWorkspaceUid: text('primary_workspace_uid'),
  primaryProjectUid: text('primary_project_uid'),
  image: text('image'),
  slug: text('slug').unique().notNull(),
  type: userTypeEnum('type').default('individual'),
  country: char('country', { length: 3 }),
  website: text('website'),
  isPrivate: boolean('is_private').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  bio: text('bio'),
  locale: text('locale').default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  migratedAt: timestamp('migrated_at', { withTimezone: true }),
  existingPlanetUser: boolean('existing_planet_user').default(false),
  workspaceRole: workspaceRoleEnum('workspace_role').default('member'),
}, () => ({
  emailFormat: check('email_format', sql`email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
}));



export const workspace = pgTable('workspace', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: workspaceTypeEnum('type').notNull(),
  description: text('description'),
  image: text('image'),
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
  slugFormat: check('slug_format', sql`slug ~* '^[a-z0-9-]+$' AND length(slug) >= 3`),
  emailFormat: check('email_format', sql`email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
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
  invitedById: integer('invited_by_id').references(() => user.id, { onDelete: 'set null' }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => ({
  uniqueMembership: unique('unique_workspace_membership').on(table.workspaceId, table.userId),
  workspaceIdx: index('workspace_members_workspace_idx').on(table.workspaceId),
  userIdx: index('workspace_members_user_idx').on(table.userId),
  joinedAfterInvited: check('joined_after_invited',
    sql`invited_at IS NULL OR joined_at >= invited_at`),
  activeStatusLogic: check('active_status_logic',
    sql`status != 'active' OR joined_at IS NOT NULL`),
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
  storageProvider: text('storage_provider').default('r2'),
  storagePath: text('storage_path'),
  thumbnailPath: text('thumbnail_path'),
  compressionRatio: decimal('compression_ratio', { precision: 4, scale: 2 }),
  uploadedById: integer('uploaded_by_id').references(() => user.id, { onDelete: 'set null' }),
  altText: text('alt_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  entityTypeEntityIdIdx: index('image_entity_lookup_idx').on(table.entityType, table.entityId),
  primaryImageIdx: index('image_primary_idx').on(table.entityType, table.entityId, table.isPrimary)
    .where(sql`is_primary = true AND deleted_at IS NULL`),
  sizePositive: check('size_positive', sql`size IS NULL OR size > 0`),
  dimensionsPositive: check('dimensions_positive',
    sql`(width IS NULL OR width > 0) AND (height IS NULL OR height > 0)`),
  reasonableFileSize: check('reasonable_file_size',
    sql`size IS NULL OR size <= 104857600`),
  primaryImageLogic: check('primary_image_logic',
    sql`is_primary = false OR (is_primary = true AND deleted_at IS NULL)`),
  validMimeType: check('valid_mime_type',
    sql`mime_type IS NULL OR mime_type ~* '^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$'`),
  filenameRequired: check('filename_required',
    sql`filename IS NOT NULL AND length(trim(filename)) > 0`)
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
  batchId: text('batch_id'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userUnreadActiveIdx: index('notifications_user_unread_active_idx')
    .on(table.userId, table.isRead, table.isArchived)
    .where(sql`is_read = false AND is_archived = false`),
  userNotificationsIdx: index('notifications_user_list_idx').on(table.userId, table.createdAt),
  scheduledProcessingIdx: index('notifications_scheduled_processing_idx')
    .on(table.scheduledFor)
    .where(sql`scheduled_for IS NOT NULL AND sent_at IS NULL`),
  validPriority: check('valid_priority',
    sql`priority IN ('low', 'normal', 'high', 'urgent')`),
  scheduledInFuture: check('scheduled_in_future',
    sql`scheduled_for IS NULL OR scheduled_for >= created_at`),
  expiresAfterCreation: check('expires_after_creation',
    sql`expires_at IS NULL OR expires_at > created_at`),
  deliveredAfterSent: check('delivered_after_sent',
    sql`delivered_at IS NULL OR sent_at IS NULL OR delivered_at >= sent_at`),
  retryCountValid: check('retry_count_valid',
    sql`retry_count >= 0 AND retry_count <= 10`),
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
  source: text('source').default('web'),
  ipAddress: text('ip_address'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityAuditIdx: index('audit_log_entity_audit_idx')
    .on(table.entityType, table.entityId, table.occurredAt),
  userActivityIdx: index('audit_log_user_activity_idx')
    .on(table.userId, table.occurredAt)
    .where(sql`user_id IS NOT NULL`),
  workspaceAuditIdx: index('audit_log_workspace_audit_idx')
    .on(table.workspaceId, table.occurredAt)
    .where(sql`workspace_id IS NOT NULL`),
  validEntityId: check('valid_entity_id',
    sql`length(trim(entity_id)) > 0`),
  validSource: check('valid_source',
    sql`source IN ('web', 'mobile', 'api', 'system', 'migration')`),
  occurredAtNotFuture: check('occurred_at_not_future',
    sql`occurred_at <= NOW()`),
}))



export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  workspaceId: integer('workspace_id').notNull().references(() => workspace.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  purpose: text('purpose'),
  type: text('type'),
  ecosystem: text('ecosystem'),
  scale: text('scale'),
  classification: text('classification'),
  target: integer('target'),
  originalGeometry: jsonb('original_geometry'),
  website: text('website'),
  image: text('image'),
  videoUrl: text('video_url'),
  country: char('country', { length: 3 }),
  location: geometryWithGeoJSON(4326)('location'),
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').default(true).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  isPersonal: boolean('is_personal').default(false).notNull(),
  intensity: text('intensity'),
  revisionPeriodicity: text('revision_periodicity'),
  migratedProject: boolean('migrated_project').default(false),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  workspaceProjectsIdx: index('project_workspace_active_idx')
    .on(table.workspaceId, table.isActive, table.isPublic),
  userProjectsIdx: index('project_user_projects_idx')
    .on(table.createdById, table.isActive),
  locationIdx: index('project_location_gist_idx').using('gist', table.location),
  targetPositive: check('target_positive', sql`target IS NULL OR target > 0`),
  validIntensity: check('valid_intensity',
    sql`intensity IS NULL OR intensity IN ('low', 'medium', 'high')`),
  validScale: check('valid_scale',
    sql`scale IS NULL OR scale IN ('small', 'medium', 'large', 'enterprise')`),
  websiteFormat: check('website_format',
    sql`website IS NULL OR website ~* '^https?://'`),
  primaryProjectLogic: check('primary_project_logic',
    sql`is_primary = false OR (is_primary = true AND is_active = true)`),
  publicProjectLogic: check('public_project_logic',
    sql`is_personal = false OR is_public = false`),
  flaggedProjectReason: check('flagged_project_reason',
    sql`flag = false OR flag_reason IS NOT NULL`),
}));


export const projectMember = pgTable('project_member', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  invitedById: integer('invited_by_id').references(() => user.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  status: memberStatusEnum('status').default('active'),
  siteAccess: siteAccessEnum('site_access').default('all_sites').notNull(),
  restrictedSites: text('restricted_sites').array().default([]),
  bulkInviteId: integer('bulk_invite_id').references(() => bulkInvite.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // 🔧 ADD: Soft delete
}, (table) => ({
  uniqueMember: unique('unique_project_member').on(table.projectId, table.userId),
  projectMembersIdx: index('project_members_active_idx')
    .on(table.projectId, table.status)
    .where(sql`deleted_at IS NULL`),
  userProjectsIdx: index('project_members_user_active_idx')
    .on(table.userId, table.status)
    .where(sql`deleted_at IS NULL`),
  joinedAfterInvited: check('joined_after_invited',
    sql`invited_at IS NULL OR joined_at IS NULL OR joined_at >= invited_at`),
  activeMemberJoined: check('active_member_joined',
    sql`status != 'active' OR joined_at IS NOT NULL`),
  inviterNotSelf: check('inviter_not_self',
    sql`invited_by_id IS NULL OR invited_by_id != user_id`),
  restrictedSitesValidAccess: check('restricted_sites_valid_access',
    sql`site_access != 'limited_access' OR array_length(restricted_sites, 1) > 0`),
}));

export const bulkInvite = pgTable('bulk_invite', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  emailDomainRestrictions: text('email_domain_restrictions').array().default([]),
  message: text('message'),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedById: integer('invited_by_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  discardedById: integer('discarded_by_id').references(() => user.id, { onDelete: 'set null' }),
  discardedAt: timestamp('discarded_at', { withTimezone: true }),
  status: inviteStatusEnum('status').notNull().default('pending'),
  token: uuid('token').defaultRandom().notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  maxUses: integer('max_uses').default(100),
  currentUses: integer('current_uses').default(0),
  totalInvitesSent: integer('total_invites_sent').default(0),
  totalAccepted: integer('total_accepted').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectActiveInvitesIdx: index('bulk_invite_project_active_idx')
    .on(table.projectId, table.status)
    .where(sql`deleted_at IS NULL`),
  tokenLookupIdx: index('bulk_invite_token_active_idx')
    .on(table.token, table.status)
    .where(sql`status = 'pending' AND deleted_at IS NULL`),
  expiresInFuture: check('expires_in_future',
    sql`expires_at > created_at`),
  maxUsesPositive: check('max_uses_positive',
    sql`max_uses IS NULL OR max_uses > 0`),
  currentUsesValid: check('current_uses_valid',
    sql`current_uses >= 0 AND (max_uses IS NULL OR current_uses <= max_uses)`),
  analyticsValid: check('analytics_valid',
    sql`total_invites_sent >= 0 AND total_accepted >= 0 AND total_accepted <= total_invites_sent`),
  expiredOrDiscardedNotPending: check('expired_or_discarded_not_pending',
    sql`(status != 'expired' OR expires_at <= NOW()) AND (status != 'discarded' OR discarded_by_id IS NOT NULL)`),
  discardedHasTimestamp: check('discarded_has_timestamp',
    sql`discarded_by_id IS NULL OR discarded_at IS NOT NULL`),
  validEmailDomains: check('valid_email_domains',
    sql`array_length(email_domain_restrictions, 1) IS NULL OR array_length(email_domain_restrictions, 1) > 0`),
}));


export const site = pgTable('site', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  location: geometryWithGeoJSON(4326)('location'),
  area: doublePrecision('area'),
  status: siteStatusEnum('status').default('planning'),
  soilType: text('soil_type'),
  elevation: doublePrecision('elevation'),
  slope: doublePrecision('slope'),
  aspect: text('aspect'),
  waterAccess: boolean('water_access').default(false),
  accessibility: text('accessibility'),
  plannedPlantingDate: timestamp('planned_planting_date', { withTimezone: true }),
  actualPlantingDate: timestamp('actual_planting_date', { withTimezone: true }),
  expectedTreeCount: integer('expected_tree_count'),
  image: text('image'),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  migratedSite: boolean('migrated_site').default(false),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  metadata: jsonb('metadata'),
  originalGeometry: jsonb('original_geometry'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectSitesIdx: index('site_project_active_idx')
    .on(table.projectId, table.status)
    .where(sql`deleted_at IS NULL`),
  locationIdx: index('site_location_gist_idx').using('gist', table.location),
  createdByIdx: index('site_created_by_idx').on(table.createdById),
  areaPositive: check('area_positive', sql`area IS NULL OR area > 0`),
  elevationRange: check('elevation_range',
    sql`elevation IS NULL OR (elevation >= -500 AND elevation <= 9000)`),
  slopeRange: check('slope_range',
    sql`slope IS NULL OR (slope >= 0 AND slope <= 90)`),
  validAspect: check('valid_aspect',
    sql`aspect IS NULL OR aspect IN ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')`),
  validAccessibility: check('valid_accessibility',
    sql`accessibility IS NULL OR accessibility IN ('easy', 'moderate', 'difficult')`),
  validSoilType: check('valid_soil_type',
    sql`soil_type IS NULL OR soil_type IN ('clay', 'sand', 'loam', 'rocky', 'peat', 'mixed')`),
  expectedTreeCountPositive: check('expected_tree_count_positive',
    sql`expected_tree_count IS NULL OR expected_tree_count > 0`),
  actualAfterPlanned: check('actual_after_planned',
    sql`planned_planting_date IS NULL OR actual_planting_date IS NULL OR actual_planting_date >= planned_planting_date`),
  plantedSiteHasDate: check('planted_site_has_date',
    sql`status != 'planted' OR actual_planting_date IS NOT NULL`),
  flaggedSiteReason: check('flagged_site_reason',
    sql`flag = false OR flag_reason IS NOT NULL`),
}));


export const projectInvites = pgTable('project_invite', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  message: text('message'),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedById: integer('invited_by_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  discardedById: integer('discarded_by_id').references(() => user.id, { onDelete: 'set null' }),
  discardedAt: timestamp('discarded_at', { withTimezone: true }),
  status: inviteStatusEnum('status').notNull().default('pending'),
  token: uuid('token').defaultRandom().notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  retryCount: integer('retry_count').default(0),
  inviteHash: text('invite_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  projectInvitesIdx: index('project_invite_project_status_idx')
    .on(table.projectId, table.status),
  tokenLookupIdx: index('project_invite_token_active_idx')
    .on(table.token, table.status)
    .where(sql`status = 'pending'`),
  inviterIdx: index('project_invite_inviter_idx')
    .on(table.invitedById, table.createdAt),
  acceptedBeforeExpiry: check('accepted_before_expiry',
    sql`accepted_at IS NULL OR accepted_at <= expires_at`),
  expiresInFuture: check('expires_in_future',
    sql`expires_at > created_at`),
  validEmail: check('valid_email',
    sql`email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  acceptedStatusHasTimestamp: check('accepted_status_has_timestamp',
    sql`status != 'accepted' OR accepted_at IS NOT NULL`),
  discardedStatusHasDetails: check('discarded_status_has_details',
    sql`status != 'discarded' OR (discarded_by_id IS NOT NULL AND discarded_at IS NOT NULL)`),
  expiredStatusAfterExpiry: check('expired_status_after_expiry',
    sql`status != 'expired' OR expires_at <= NOW()`),
  retryCountValid: check('retry_count_valid',
    sql`retry_count >= 0 AND retry_count <= 5`), // Max 5 retry attempts
  deliveredAfterSent: check('delivered_after_sent',
    sql`delivered_at IS NULL OR sent_at IS NULL OR delivered_at >= sent_at`),
}));

export const scientificSpecies = pgTable('scientific_species', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  scientificName: text('scientific_name').notNull().unique(),
  commonName: text('common_name'),
  kingdom: text('kingdom').default('Plantae'),
  phylum: text('phylum').default('Tracheophyta'),
  class: text('class').default('Magnoliopsida'),
  order: text('order'),
  family: text('family'),
  genus: text('genus'),
  species: text('species'),
  subspecies: text('subspecies'),
  cultivar: text('cultivar'),
  habitat: text('habitat').array().default([]),
  nativeRegions: text('native_regions').array().default([]),
  climateZones: text('climate_zones').array().default([]),
  soilTypes: text('soil_types').array().default([]),
  drainagePreference: text('drainage_preference'),
  phTolerance: text('ph_tolerance'),
  saltTolerance: text('salt_tolerance'),
  matureHeight: doublePrecision('mature_height'),
  matureWidth: doublePrecision('mature_width'),
  growthRate: text('growth_rate'),
  lifespan: integer('lifespan'),
  rootSystem: text('root_system'),
  lightRequirement: text('light_requirement'),
  waterRequirement: text('water_requirement'),
  temperatureMinimum: doublePrecision('temperature_minimum'),
  temperatureMaximum: doublePrecision('temperature_maximum'),
  frostTolerance: boolean('frost_tolerance').default(false),
  droughtTolerance: boolean('drought_tolerance').default(false),
  conservationStatus: text('conservation_status'),
  isNative: boolean('is_native').default(true),
  isInvasive: boolean('is_invasive').default(false),
  isEndangered: boolean('is_endangered').default(false),
  isProtected: boolean('is_protected').default(false),
  wildlifeValue: text('wildlife_value'),
  pollinatorFriendly: boolean('pollinator_friendly').default(false),
  carbonSequestration: text('carbon_sequestration'),
  erosionControl: boolean('erosion_control').default(false),
  windbreakSuitability: boolean('windbreak_suitability').default(false),
  bestPlantingMonths: integer('best_planting_months').array().default([]),
  propagationMethod: text('propagation_method').array().default([]),
  seedTreatment: text('seed_treatment'),
  plantingSpacing: doublePrecision('planting_spacing'),
  companionSpecies: text('companion_species').array().default([]),
  description: text('description'),
  image: text('image'),
  additionalImages: text('additional_images').array().default([]),
  gbifId: text('gbif_id'),
  iplantId: text('iucn_id'),
  wikipediaUrl: text('wikipedia_url'),
  dataQuality: text('data_quality').default('pending'),
  verifiedById: integer('verified_by_id').references(() => user.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  dataSource: text('data_source'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
}, (table) => ({
  scientificNameIdx: index('species_scientific_name_idx').on(table.scientificName),
  commonNameIdx: index('species_common_name_idx').on(table.commonName),
  familyGenusIdx: index('species_family_genus_idx').on(table.family, table.genus),
  habitatClimateIdx: index('species_habitat_climate_idx').using('gin', table.habitat, table.climateZones),
  soilDrainageIdx: index('species_soil_drainage_idx').on(table.soilTypes, table.drainagePreference),
  conservationNativeIdx: index('species_conservation_native_idx')
    .on(table.conservationStatus, table.isNative, table.isEndangered),
  growthSizeIdx: index('species_growth_size_idx')
    .on(table.growthRate, table.matureHeight, table.lifespan),
  matureHeightPositive: check('mature_height_positive',
    sql`mature_height IS NULL OR mature_height > 0`),
  matureWidthPositive: check('mature_width_positive',
    sql`mature_width IS NULL OR mature_width > 0`),
  lifespanPositive: check('lifespan_positive',
    sql`lifespan IS NULL OR lifespan > 0`),
  plantingSpacingPositive: check('planting_spacing_positive',
    sql`planting_spacing IS NULL OR planting_spacing > 0`),
  validTemperatureRange: check('valid_temperature_range',
    sql`temperature_minimum IS NULL OR temperature_maximum IS NULL OR temperature_minimum <= temperature_maximum`),
  validGrowthRate: check('valid_growth_rate',
    sql`growth_rate IS NULL OR growth_rate IN ('slow', 'moderate', 'fast')`),
  validLightRequirement: check('valid_light_requirement',
    sql`light_requirement IS NULL OR light_requirement IN ('full-sun', 'partial-shade', 'full-shade', 'adaptable')`),
  validWaterRequirement: check('valid_water_requirement',
    sql`water_requirement IS NULL OR water_requirement IN ('low', 'moderate', 'high')`),
  validDataQuality: check('valid_data_quality',
    sql`data_quality IN ('verified', 'pending', 'draft')`),
  validConservationStatus: check('valid_conservation_status',
    sql`conservation_status IS NULL OR conservation_status IN ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD')`),
  verifiedHasVerifier: check('verified_has_verifier',
    sql`data_quality != 'verified' OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)`),
  nativeNotInvasive: check('native_not_invasive',
    sql`NOT (is_native = true AND is_invasive = true)`),
  validPlantingMonths: check('valid_planting_months',
    sql`array_length(best_planting_months, 1) IS NULL OR (array_length(best_planting_months, 1) <= 12 AND best_planting_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12])`),
}));

export const projectSpecies = pgTable('project_species', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  scientificSpeciesId: integer('scientific_species_id').references(() => scientificSpecies.id, { onDelete: 'set null' }),
  isUnknown: boolean('is_unknown').default(false).notNull(),
  speciesName: text('species_name'),
  commonName: text('common_name'),
  image: text('image'),
  notes: text('notes'),
  favourite: boolean('favourite').default(false).notNull(),
  isDisabled: boolean('is_disabled').default(false),
  addedById: integer('added_by_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  uniqueProjectSpecies: unique('unique_project_species').on(table.projectId, table.scientificSpeciesId),
  scientificSpeciesIdIdx: index('scientific_species_id_Idx').on(table.scientificSpeciesId)
}));


export const speciesRequest = pgTable('species_request', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  scientificName: text('scientific_name').notNull(),
  commonName: text('common_name'),
  description: text('description'),
  requestReason: text('request_reason').notNull(),
  family: text('family'),
  habitat: text('habitat'),
  nativeRegion: text('native_region'),
  conservationStatus: text('conservation_status'),
  gbifId: text('gbif_id'),
  wikipediaUrl: text('wikipedia_url'),
  sourceUrl: text('source_url'),
  requestedById: integer('requested_by_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => project.id, { onDelete: 'cascade' }),
  urgency: text('urgency').default('normal'),
  status: speciesRequestStatusEnum('status').notNull().default('pending'),
  reviewedById: integer('reviewed_by_id').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  createdSpeciesId: integer('created_species_id').references(() => scientificSpecies.id),
  duplicateOfRequestId: integer('duplicate_of_request_id').references(() => speciesRequest.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  adminReviewQueueIdx: index('species_request_review_queue_idx')
    .on(table.status, table.urgency, table.createdAt)
    .where(sql`status = 'pending'`),
  userRequestsIdx: index('species_request_user_idx')
    .on(table.requestedById, table.status, table.createdAt),
  projectRequestsIdx: index('species_request_project_idx')
    .on(table.projectId, table.status)
    .where(sql`project_id IS NOT NULL`),
  scientificNameDuplicateIdx: index('species_request_duplicate_idx')
    .on(table.scientificName, table.status)
    .where(sql`status IN ('pending', 'approved')`),
}));

export const intervention = pgTable('intervention', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  hid: text('hid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  siteId: integer('site_id').references(() => site.id, { onDelete: 'set null' }),
  type: interventionTypeEnum('type').notNull(),
  status: interventionStatusEnum('status').default('planned'),
  idempotencyKey: text('idempotency_key').unique().notNull(),
  registrationDate: timestamp('registration_date', { withTimezone: true }).notNull(),
  interventionStartDate: timestamp('intervention_start_date', { withTimezone: true }).notNull(),
  interventionEndDate: timestamp('intervention_end_date', { withTimezone: true }).notNull(),
  location: geometryWithGeoJSON(4326)('location'),
  area: doublePrecision('area'),
  totalTreeCount: integer('total_tree_count').default(0),
  totalSampleTreeCount: integer('total_sample_tree_count').default(0),
  captureMode: captureModeEnum('capture_mode').notNull().default('on-site'),
  captureStatus: captureStatusEnum('capture_status').notNull().default('complete'),
  deviceLocation: jsonb('device_location'),
  originalGeometry: jsonb('original_geometry'),
  description: text('description'),
  image: text('image'),
  isPrivate: boolean('is_private').default(false).notNull(),
  flag: boolean('flag').default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  migratedIntervention: boolean('migrated_intervention').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectDateRangeIdx: index('intervention_project_date_range_idx')
    .on(table.projectId, table.interventionStartDate, table.status)
    .where(sql`deleted_at IS NULL`),
  projectTypeStatusIdx: index('intervention_project_type_status_idx')
    .on(table.projectId, table.type, table.status)
    .where(sql`deleted_at IS NULL`),
  locationIdx: index('intervention_location_gist_idx').using('gist', table.location),
  userInterventionsIdx: index('intervention_user_idx')
    .on(table.userId, table.interventionEndDate)
    .where(sql`deleted_at IS NULL`),
  validDateRange: check('valid_date_range', sql`intervention_start_date <= intervention_end_date`),
  areaPositive: check('area_positive', sql`area IS NULL OR area >= 0`),
  treeCountsNonNegative: check('tree_counts_non_negative',
    sql`total_tree_count >= 0 AND total_sample_tree_count >= 0`),
  flaggedHasReason: check('flagged_has_reason',
    sql`flag = false OR flag_reason IS NOT NULL`),
  registrationNotFuture: check('registration_not_future',
    sql`registration_date <= NOW()`),
}));

export const interventionSpecies = pgTable('intervention_species', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').notNull().references(() => intervention.id, { onDelete: 'cascade' }),
  scientificSpeciesId: integer('scientific_species_id').references(() => scientificSpecies.id, { onDelete: 'set null' }),
  isUnknown: boolean('is_unknown').default(false).notNull(),
  speciesName: text('species_name'),
  commonName: text('common_name'),
  speciesCount: integer('species_count').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  interventionSpeciesIdx: index('intervention_species_intervention_idx').on(table.interventionId),
  unknownSpeciesLogic: check('unknown_species_logic',
    sql`(is_unknown = false AND scientific_species_id IS NOT NULL) OR (is_unknown = true AND scientific_species_id IS NULL)`),
  speciesCountPositive: check('species_count_positive', sql`species_count > 0`),
}));

export const tree = pgTable('tree', {
  id: serial('id').primaryKey(),
  hid: text('hid').notNull().unique(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').notNull().references(() => intervention.id, { onDelete: 'cascade' }),
  interventionSpeciesId: integer('intervention_species_id').notNull().references(() => interventionSpecies.id, { onDelete: 'restrict' }),
  speciesName: text('species_name'),
  commonName: text('common_name'),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  tag: text('tag'),
  treeType: treeTypeEnum('tree_type').default('sample'),
  location: geometryWithGeoJSON(4326)('location'),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  currentHeight: doublePrecision('current_height'),
  currentWidth: doublePrecision('current_width'),
  currentHealthScore: integer('current_health_score'),
  status: treeStatusEnum('status').default('alive').notNull(),
  statusReason: text('status_reason'),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
  plantingDate: timestamp('planting_date', { withTimezone: true }),
  lastMeasurementDate: timestamp('last_measurement_date', { withTimezone: true }),
  nextMeasurementDate: timestamp('next_measurement_date', { withTimezone: true }),
  image: text('image'),
  remeasured: boolean().default(false),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  remeasuredIdx: index('tree_intervention_remeasured_idx')
    .on(table.interventionId, table.remeasured),
  interventionTreesIdx: index('tree_intervention_status_idx')
    .on(table.interventionId, table.status)
    .where(sql`deleted_at IS NULL`),
  speciesTreesIdx: index('tree_species_idx')
    .on(table.interventionSpeciesId, table.status),
  measurementScheduleIdxmeasurementScheduleIdx: index('tree_measurement_schedule_idx')
    .on(table.nextMeasurementDate, table.status)
    .where(sql`next_measurement_date IS NOT NULL AND status = 'alive' AND deleted_at IS NULL`),
  healthMonitoringIdx: index('tree_health_monitoring_idx')
    .on(table.currentHealthScore, table.lastMeasurementDate)
    .where(sql`current_health_score IS NOT NULL AND deleted_at IS NULL`),
  heightWidthPositive: check('height_width_positive',
    sql`(current_height IS NULL OR current_height >= 0) AND (current_width IS NULL OR current_width >= 0)`),
  altitudeRange: check('altitude_range',
    sql`altitude IS NULL OR (altitude >= -500 AND altitude <= 9000)`),
  accuracyPositive: check('accuracy_positive', sql`accuracy IS NULL OR accuracy >= 0`),
  healthScoreRange: check('health_score_range',
    sql`current_health_score IS NULL OR (current_health_score >= 0 AND current_health_score <= 100)`),
  deadTreeHasReason: check('dead_tree_has_reason',
    sql`status != 'dead' OR status_reason IS NOT NULL`),
  statusChangedAtLogic: check('status_changed_at_logic',
    sql`status_changed_at IS NULL OR status_changed_at <= NOW()`),
  measurementDateLogic: check('measurement_date_logic',
    sql`last_measurement_date IS NULL OR next_measurement_date IS NULL OR next_measurement_date > last_measurement_date`),
}));


export const treeRecord = pgTable('tree_record', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  treeId: integer('tree_id').notNull().references(() => tree.id, { onDelete: 'cascade' }),
  recordedById: integer('recorded_by_id').notNull().references(() => user.id, { onDelete: 'set null' }),
  recordType: recordTypeEnum('record_type').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  height: doublePrecision('height'),
  width: doublePrecision('width'),
  healthScore: integer('health_score'),
  vitalityScore: integer('vitality_score'),
  previousStatus: treeStatusEnum('previous_status'),
  newStatus: treeStatusEnum('new_status'),
  statusReason: text('status_reason'),
  findings: text('findings'),
  findingsSeverity: text('findings_severity'),
  notes: text('notes'),
  priorityLevel: text('priority_level'),
  weatherConditions: jsonb('weather_conditions'),
  soilConditions: jsonb('soil_conditions'),
  pestsObserved: jsonb('pests_observed'),
  diseasesObserved: jsonb('diseases_observed'),
  damageObserved: jsonb('damage_observed'),
  growthRate: decimal('growth_rate', { precision: 6, scale: 3 }),
  leafDensity: text('leaf_density'),
  fruitingStatus: text('fruiting_status'),
  surroundingVegetation: text('surrounding_vegetation'),
  recommendedActions: jsonb('recommended_actions'),
  image: text('image'),
  deviceLocation: jsonb('device_location'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  treeLatestRecordIdx: index('tree_record_latest_idx')
    .on(table.treeId, table.recordedAt)
    .where(sql`deleted_at IS NULL`),
  priorityRecordsIdx: index('tree_record_priority_idx')
    .on(table.priorityLevel, table.recordedAt)
    .where(sql`priority_level IN ('high', 'urgent') AND deleted_at IS NULL`),
  healthTrendsIdx: index('tree_record_health_trends_idx')
    .on(table.treeId, table.healthScore, table.recordedAt)
    .where(sql`health_score IS NOT NULL AND deleted_at IS NULL`),
  healthVitalityRange: check('health_vitality_range',
    sql`(health_score IS NULL OR (health_score >= 0 AND health_score <= 100)) AND (vitality_score IS NULL OR (vitality_score >= 0 AND vitality_score <= 100))`),
  measurementsPositive: check('measurements_positive',
    sql`(height IS NULL OR height >= 0) AND (width IS NULL OR width >= 0)`),
  recordedAtNotFuture: check('recorded_at_not_future', sql`recorded_at <= NOW()`),
  statusChangeLogic: check('status_change_logic',
    sql`(previous_status IS NULL AND new_status IS NULL) OR (previous_status IS NOT NULL AND new_status IS NOT NULL)`),
  validSeverity: check('valid_severity',
    sql`findings_severity IS NULL OR findings_severity IN ('low', 'medium', 'high', 'critical')`),
  validPriority: check('valid_priority',
    sql`priority_level IS NULL OR priority_level IN ('low', 'normal', 'high', 'urgent')`),
}));


export const userRelations = relations(user, ({ many }) => ({
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
  speciesRequests: many(speciesRequest, { relationName: 'requestedBy' }),
  reviewedSpeciesRequests: many(speciesRequest, { relationName: 'reviewedBy' }),
  workspaceMemberships: many(workspaceMember),
  createdWorkspaces: many(workspace, { relationName: 'createdBy' }),
  sentWorkspaceInvites: many(workspaceMember, { relationName: 'invitedBy' }),
  surveys: many(survey),

  verifiedSpecies: many(scientificSpecies, { relationName: 'verifiedBy' }),
  uploadedImages: many(image, { relationName: 'uploadedBy' }),
}));

export const scientificSpeciesRelations = relations(scientificSpecies, ({ one, many }) => ({
  projectSpecies: many(projectSpecies),
  interventionSpecies: many(interventionSpecies),
  verifiedBy: one(user, {
    fields: [scientificSpecies.verifiedById],
    references: [user.id],
    relationName: 'verifiedBy',
  }),
}));


export const interventionSpeciesRelations = relations(interventionSpecies, ({ one, many }) => ({
  intervention: one(intervention, {
    fields: [interventionSpecies.interventionId],
    references: [intervention.id],
  }),
  scientificSpecies: one(scientificSpecies, {
    fields: [interventionSpecies.scientificSpeciesId],
    references: [scientificSpecies.id],
  }),
  trees: many(tree),
}));


export const interventionRelations = relations(intervention, ({ one, many }) => ({
  project: one(project, {
    fields: [intervention.projectId],
    references: [project.id],
  }),
  site: one(site, {
    fields: [intervention.siteId],
    references: [site.id],
  }),
  user: one(user, {
    fields: [intervention.userId],
    references: [user.id],
    relationName: 'userInterventions',
  }),


  trees: many(tree),
  species: many(interventionSpecies),
}));


export const treeRelations = relations(tree, ({ one, many }) => ({
  intervention: one(intervention, {
    fields: [tree.interventionId],
    references: [intervention.id],
  }),
  interventionSpecies: one(interventionSpecies, {
    fields: [tree.interventionSpeciesId],
    references: [interventionSpecies.id],
  }),
  createdBy: one(user, {
    fields: [tree.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  records: many(treeRecord),
}));


export const imageRelations = relations(image, ({ one }) => ({
  uploadedBy: one(user, {
    fields: [image.uploadedById],
    references: [user.id],
    relationName: 'uploadedBy',
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
    fields: [projectInvites.discardedById],
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
    fields: [bulkInvite.discardedById],
    references: [user.id],
  }),
  members: many(projectMember),
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
  createdSpecies: one(scientificSpecies, {
    fields: [speciesRequest.createdSpeciesId],
    references: [scientificSpecies.id],
  }),
  duplicateOf: one(speciesRequest, {
    fields: [speciesRequest.duplicateOfRequestId],
    references: [speciesRequest.id],
  }),
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
  invitedBy: one(user, { // 🔧 ADD: Missing relation
    fields: [projectMember.invitedById],
    references: [user.id],
    relationName: 'invitedBy',
  }),
  bulkInvite: one(bulkInvite, {
    fields: [projectMember.bulkInviteId],
    references: [bulkInvite.id],
  }),
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