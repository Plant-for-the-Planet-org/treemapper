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

export type FlagLevel = 'error' | 'warning' | 'info';
export type FlagEntity = 'location' | 'species' | 'measurements' | 'intervention' | 'other' | 'project' | 'site' | 'user' | 'migration';


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
  'migration',
  'form'
]);


export interface FlagReasonEntry {
  uid: string;
  type: FlagEntity;
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



// ---------------------------------------------------------------------------
// Form builder schema (stored as a JSONB blob on the `form` table)
//
// The web form builder edits a whole form in memory and saves it atomically,
// so the section/field tree lives in one `schema` jsonb column rather than in
// normalized tables. These types mirror the frontend `Form` types 1:1
// (apps/web/src/forms/types.ts) so the same shape round-trips through the API.
// ---------------------------------------------------------------------------
export type FormFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'radio';

export type FormConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormConditionalRule {
  id: string;
  targetFieldId: string;
  operator: FormConditionOperator;
  value: string;
  action: 'show' | 'hide';
}

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  conditions: FormConditionalRule[];
  // Type-specific settings (text/number/date config or { options } for choices).
  config: Record<string, any>;
}

export interface FormSectionDefinition {
  id: string;
  title: string;
  description: string;
  collapsed: boolean;
  fields: FormFieldDefinition[];
}

export interface FormSchema {
  sections: FormSectionDefinition[];
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

export const PROJECT_PERMISSIONS = [
  'approve_intervention',
  'approve_site',
  'add_site',
  'request_species',
  'manage_form',
] as const;
export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[number];
export const projectStatusEnum = pgEnum('project_status', ['active', 'in_review', 'suspended', 'disabled']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'declined', 'expired', 'discarded']);
export const imageUploadDeviceEnum = pgEnum('image_upload_device', ['web', 'mobile', 'server']);
export const siteStatusEnum = pgEnum('site_status', ['planted', 'planting', 'barren', 'reforestation', 'planning', 'other']);
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

export const imageEntityEnum = pgEnum('image_entity', ['project', 'site', 'user', 'intervention', 'tree', 'species', 'feedback']);
export const treeTypeEnum = pgEnum('tree_enum', ['single', 'sample', 'plot']);
export const plotShapeEnum = pgEnum('plot_shape', ['circle', 'rectangle', 'polygon']);
export const imageTypeEnum = pgEnum('image_type', ['before', 'during', 'after', 'detail', 'overview', 'progress', 'aerial', 'ground', 'record']);
export const interventionStatusEnum = pgEnum('intervention_status', ['planned', 'planning', 'active', 'completed', 'failed', 'on-hold', 'cancelled']);
export const feedbackTypeEnum = pgEnum('feedback_type', ['feedback', 'issue', 'translation_fix']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'reviewed', 'resolved', 'dismissed']);
export const migrationStatusEnum = pgEnum('migration_status', [
  'in_progress', 'completed', 'failed', 'started'
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending', 
  'in_review',
  'approved',
  'rejected',
]);

export const reviewCommentAuthorRoleEnum = pgEnum('review_comment_author_role', [
  'admin',
  'contributor',
]);

// Where an intervention was created from. Used to gate which sources require
// approval (see project.approvalSettings) and for audit/display.
export const interventionSourceEnum = pgEnum('intervention_source', [
  'web',
  'bulk',
  'mobile',
  'migration',
]);

export const formStatusEnum = pgEnum('form_status', ['draft', 'published']);
// Which sites a form is shown for: every site, only interventions with no site,
// or the specific sites listed in `form.siteIds`.
export const formSiteAssignmentEnum = pgEnum('form_site_assignment', ['all', 'none', 'specific']);
// Which intervention types trigger a form: every type, or the specific types
// listed in `form.interventionTypes`.
export const formInterventionAssignmentEnum = pgEnum('form_intervention_assignment', ['all', 'specific']);

// TreeMatch write-back state of a mirrored contribution against the TTC
// counter: 'pending' = local ledger changed but TTC not yet confirmed,
// 'synced' = TTC holds the same total, 'failed' = last write-back errored.
export const treematchSyncStatusEnum = pgEnum('treematch_sync_status', ['pending', 'synced', 'failed']);
// TreeMatch action log types. unmatch/ignore/restore/block/unblock have no
// endpoints yet; they are in the enum now so future endpoints need no migration.
export const treematchEventTypeEnum = pgEnum('treematch_event_type', [
  'match',
  'unmatch',
  'ignore',
  'restore',
  'block',
  'unblock',
  'sync_success',
  'sync_failure',
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

export const migrationRequest = pgTable('migration_request', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: migrationStatusEnum('status').default('in_progress').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
}, (table) => ({
  migrationReqeuestIdIdx: index('migration_request_id_idx').on(table.userId)
}))





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
  v3ApprovedAt: timestamp('v3_approved_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true })
}, () => ({
  emailFormat: check('email_format', sql`email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
}));



// Intervention sources that can be independently gated by the approval board.
// 'migration' is never gated, so it is excluded here.
export const APPROVAL_GATED_SOURCES = ['web', 'bulk', 'mobile'] as const;
export type ApprovalGatedSource = (typeof APPROVAL_GATED_SOURCES)[number];

// Per-project, granular approval configuration. Only takes effect when the
// master switch (project.approvalBoardEnabled) is on.
export type ProjectApprovalSettings = {
  // Which intervention sources require approval before being published.
  sources: Record<ApprovalGatedSource, boolean>;
  // Whether newly created sites require approval before being published.
  siteApprovalRequired: boolean;
};

export const DEFAULT_PROJECT_APPROVAL_SETTINGS: ProjectApprovalSettings = {
  sources: { web: true, bulk: true, mobile: true },
  siteApprovalRequired: true,
};

export type WorkspaceSettings = {
  approvalBoardEnabled: boolean;
  // Default approval settings new projects inherit when created in this workspace.
  approvalSettings: ProjectApprovalSettings;
  defaultProjectVisibility: 'public' | 'private';
  allowMemberInvites: boolean;
  requireApprovalForNewProjects: boolean;
  maxProjects: number | null;
  notifications: {
    onProjectCreate: boolean;
    onInterventionCreate: boolean;
    interventionProjectWhitelist: string[]; // project UIDs; empty array = all projects
    onProfileActivity: boolean;
  };
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  approvalBoardEnabled: false,
  approvalSettings: DEFAULT_PROJECT_APPROVAL_SETTINGS,
  defaultProjectVisibility: 'private',
  allowMemberInvites: false,
  requireApprovalForNewProjects: false,
  maxProjects: null,
  notifications: {
    onProjectCreate: false,
    onInterventionCreate: false,
    interventionProjectWhitelist: [],
    onProfileActivity: false,
  },
};

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
  settings: jsonb('settings').$type<WorkspaceSettings>().default(DEFAULT_WORKSPACE_SETTINGS),
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

export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: feedbackTypeEnum('type').notNull(),
  status: feedbackStatusEnum('status').notNull().default('pending'),
  description: text('description').notNull(),
  locale: text('locale'),
  appVersion: text('app_version'),
  deviceInfo: jsonb('device_info'),
  image: text('image'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  userFeedbackIdx: index('feedback_user_idx').on(table.userId, table.createdAt),
  statusTypeIdx: index('feedback_status_type_idx')
    .on(table.status, table.type, table.createdAt)
    .where(sql`deleted_at IS NULL`),
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
    .where(sql`is_primary = true AND deleted_at IS NULL`)


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
  // Soft delete: expired/removed notifications are stamped here, never hard
  // deleted. All reads must filter on `deleted_at IS NULL`.
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
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

// One row per physical device (deviceId is the client-generated id stored on
// the device). On app open the mobile app upserts this row: if the same
// deviceId logs in as a different user, ownership (userId) is reassigned.
// Used for push delivery (oneSignalId) and, later, a web device-management view.
export const userDevice = pgTable('user_device', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  deviceId: text('device_id').notNull().unique(),
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  oneSignalId: text('one_signal_id'),
  deviceOs: text('device_os'),
  deviceName: text('device_name'),
  deviceModel: text('device_model'),
  osVersion: text('os_version'),
  appVersion: text('app_version'),
  locale: text('locale'),
  timezone: text('timezone'),
  notificationPermission: boolean('notification_permission').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userDevicesIdx: index('user_device_user_idx').on(table.userId),
  oneSignalIdx: index('user_device_one_signal_idx')
    .on(table.oneSignalId)
    .where(sql`one_signal_id IS NOT NULL`),
  lastActiveIdx: index('user_device_last_active_idx').on(table.lastActiveAt),
}));

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  action: auditActionEnum('action').notNull(),
  entityType: auditEntityEnum('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
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
    .where(sql`workspace_id IS NOT NULL`)
}))



export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
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
  intensity: integer('intensity'),
  revisionPeriodicity: text('revision_periodicity'),
  migratedProject: boolean('migrated_project').default(false),
  status: projectStatusEnum('status').notNull().default('active'),
  approvalBoardEnabled: boolean('approval_board_enabled').default(false).notNull(),
  approvalSettings: jsonb('approval_settings')
    .$type<ProjectApprovalSettings>()
    .default(DEFAULT_PROJECT_APPROVAL_SETTINGS)
    .notNull(),
  apiEnabled: boolean('api_enabled').default(false).notNull(),
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
  validScale: check('valid_scale',
    sql`scale IS NULL OR scale IN ('small', 'medium', 'large', 'enterprise')`),
  websiteFormat: check('website_format',
    sql`website IS NULL OR website ~* '^https?://'`),
  primaryProjectLogic: check('primary_project_logic',
    sql`is_primary = false OR (is_primary = true AND is_active = true)`),
  flaggedProjectReason: check('flagged_project_reason',
    sql`flag = false OR flag_reason IS NOT NULL`),
}));


export const projectApiKey = pgTable('project_api_key', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  projectKeyUnique: uniqueIndex('project_api_key_project_unique').on(table.projectId),
  keyHashIdx: index('project_api_key_hash_idx').on(table.keyHash),
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
  extraPermissions: text('extra_permissions').array(),
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
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  migratedSite: boolean('migrated_site').default(false),
  reviewStatus: reviewStatusEnum('review_status'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedById: integer('approved_by_id').references(() => user.id, { onDelete: 'set null' }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectedById: integer('rejected_by_id').references(() => user.id, { onDelete: 'set null' }),
  flag: boolean('flag').default(false),
  flagReason: jsonb('flag_reason').$type<FlagReasonEntry[]>(),
  metadata: jsonb('metadata'),
  originalGeometry: jsonb('original_geometry'),
  // TTC (Plant-for-the-Planet app) sync: id of the matching site on the
  // external backend, and the last sync outcome ('synced' | 'failed' | null).
  remoteId: text('remote_id'),
  remoteSyncStatus: text('remote_sync_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectSitesIdx: index('site_project_active_idx')
    .on(table.projectId, table.status)
    .where(sql`deleted_at IS NULL`),
  locationIdx: index('site_location_gist_idx').using('gist', table.location),
  createdByIdx: index('site_created_by_idx').on(table.createdById)
}));


export const projectInvites = pgTable('project_invite', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  message: text('message'),
  projectRole: projectRoleEnum('project_role').notNull().default('contributor'),
  invitedById: integer('invited_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
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
  iucnId: text('iucn_id'),
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
  addedById: integer('added_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
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
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  siteId: integer('site_id').references(() => site.id, { onDelete: 'set null' }),
  type: interventionTypeEnum('type').notNull(),
  discriminator: interventionDiscriminatorEnum('discriminator').notNull().default('intervention'),
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
  metadata: jsonb('metadata'),
  migratedIntervention: boolean('migrated_intervention').default(false),
  source: interventionSourceEnum('source'),
  reviewStatus: reviewStatusEnum('review_status'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedById: integer('approved_by_id').references(() => user.id, { onDelete: 'set null' }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectedById: integer('rejected_by_id').references(() => user.id, { onDelete: 'set null' }),
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
  plotDiscriminatorIdx: index('intervention_plot_idx')
    .on(table.projectId, table.discriminator)
    .where(sql`discriminator = 'plot' AND deleted_at IS NULL`),
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
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

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
  isUnknown: boolean('is_unknown'),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  tag: text('tag'),
  treeType: treeTypeEnum('tree_type').default('sample'),
  location: geometryWithGeoJSON(4326)('location'),
  originalGeometry: jsonb('original_geometry'),

  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  height: doublePrecision('height'),
  width: doublePrecision('width'),
  currentHealthScore: integer('current_health_score'),
  status: treeStatusEnum('status').default('alive').notNull(),
  statusReason: text('status_reason'),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
  plantingDate: timestamp('planting_date', { withTimezone: true }),
  lastMeasurementDate: timestamp('last_measurement_date', { withTimezone: true }),
  nextMeasurementDate: timestamp('next_measurement_date', { withTimezone: true }),
  image: text('image'),
  remeasured: boolean('remeasured').default(false),
  migratedTree: boolean('migrated_tree').default(false),
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
  measurementScheduleIdx: index('tree_measurement_schedule_idx')
    .on(table.nextMeasurementDate, table.status)
    .where(sql`next_measurement_date IS NOT NULL AND status = 'alive' AND deleted_at IS NULL`),
  healthMonitoringIdx: index('tree_health_monitoring_idx')
    .on(table.currentHealthScore, table.lastMeasurementDate)
    .where(sql`current_health_score IS NOT NULL AND deleted_at IS NULL`),
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
  recordedById: integer('recorded_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  recordType: recordTypeEnum('record_type').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  height: doublePrecision('height'),
  width: doublePrecision('width'),
  healthScore: integer('health_score'),
  vitalityScore: integer('vitality_score'),
  previousStatus: treeStatusEnum('previous_status'),
  metadata: jsonb('metadata'),
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


export const monitoringPlot = pgTable('monitoring_plot', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').notNull().unique()
    .references(() => intervention.id, { onDelete: 'cascade' }),
  shape: plotShapeEnum('shape'),
  plotType: text('plot_type'),
  complexity: text('complexity'),
  radius: doublePrecision('radius'),       // metres, circular plots
  length: doublePrecision('length'),       // metres, rectangular plots
  width: doublePrecision('width'),         // metres, rectangular plots
  centerLocation: geometryWithGeoJSON(4326)('center_location'),
  isComplete: boolean('is_complete').default(false).notNull(),
  metadata: jsonb('metadata'),             // Realm additional_data / meta_data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  interventionIdx: index('monitoring_plot_intervention_idx').on(table.interventionId),
  centerLocationIdx: index('monitoring_plot_center_gist_idx').using('gist', table.centerLocation),
  dimensionsPositive: check('plot_dimensions_positive',
    sql`(radius IS NULL OR radius >= 0) AND (length IS NULL OR length >= 0) AND (width IS NULL OR width >= 0)`),
}));

export const plotObservation = pgTable('plot_observation', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').notNull()
    .references(() => intervention.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),            // e.g. soil_moisture, temperature
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
  unit: text('unit'),
  value: doublePrecision('value'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  interventionIdx: index('plot_observation_intervention_idx').on(table.interventionId, table.observedAt),
}));

export const plotGroup = pgTable('plot_group', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectIdx: index('plot_group_project_idx').on(table.projectId),
}));

export const plotGroupMembership = pgTable('plot_group_membership', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  groupId: integer('group_id').notNull().references(() => plotGroup.id, { onDelete: 'cascade' }),
  interventionId: integer('intervention_id').notNull()
    .references(() => intervention.id, { onDelete: 'cascade' }),  // the plot
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueMembership: unique('plot_group_membership_unique').on(table.groupId, table.interventionId),
  groupIdx: index('plot_group_membership_group_idx').on(table.groupId),
  plotIdx: index('plot_group_membership_plot_idx').on(table.interventionId),
}));

export const reviewThread = pgTable('review_thread', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').references(() => intervention.id, { onDelete: 'cascade' }),
  siteId: integer('site_id').references(() => site.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('open'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedById: integer('closed_by_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  interventionThreadIdx: index('review_thread_intervention_idx').on(table.interventionId),
  siteThreadIdx: index('review_thread_site_idx').on(table.siteId),
  openThreadIdx: index('review_thread_open_idx')
    .on(table.status)
    .where(sql`status = 'open'`),
  validStatus: check('review_thread_valid_status', sql`status IN ('open', 'closed')`),
  oneEntityPerThread: check('review_thread_one_entity', sql`(intervention_id IS NOT NULL AND site_id IS NULL) OR (site_id IS NOT NULL AND intervention_id IS NULL)`),
}));

export const reviewComment = pgTable('review_comment', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  threadId: integer('thread_id').notNull().references(() => reviewThread.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  authorRole: reviewCommentAuthorRoleEnum('author_role').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  threadCommentsIdx: index('review_comment_thread_idx').on(table.threadId, table.createdAt),
}));

export const form = pgTable('form', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  description: text('description'),
  status: formStatusEnum('status').notNull().default('draft'),
  // Targeting: the form is shown after planting an intervention when both the
  // site rule and the intervention-type rule match.
  // - siteAssignment 'all'      -> any site (and site-less interventions)
  //   'none'     -> only interventions recorded without a site
  //   'specific' -> only the site uids in `siteIds`
  siteAssignment: formSiteAssignmentEnum('site_assignment').notNull().default('all'),
  // Site uids targeted when siteAssignment = 'specific'. Stored as uids (the same
  // way project_member.restrictedSites does) so no join table is needed.
  siteIds: text('site_ids').array().default([]),
  // - interventionAssignment 'all' -> any intervention type
  //   'specific' -> only the types in `interventionTypes`
  interventionAssignment: formInterventionAssignmentEnum('intervention_assignment').notNull().default('all'),
  interventionTypes: interventionTypeEnum('intervention_types').array().default([]),
  // Whole section/field tree, shaped like FormSchema above.
  schema: jsonb('schema').$type<FormSchema>().notNull().default(sql`'{"sections":[]}'::jsonb`),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectFormsIdx: index('form_project_idx')
    .on(table.projectId, table.status)
    .where(sql`deleted_at IS NULL`),
  publishedRequiresTimestamp: check('form_published_requires_timestamp',
    sql`status != 'published' OR published_at IS NOT NULL`),
}));

// ---------------------------------------------------------------------------
// TreeMatch: matching TTC (TreeCounter) donation contributions to
// interventions. TTC stores only the absolute allocated counter per
// contribution; these tables hold the detail (the "match ledger").
// All unit columns are integer centi-units: 100 = 1 tree (TTC convention,
// allows partial trees). Convert to whole trees only at the API boundary.
// ---------------------------------------------------------------------------

// Local mirror of a TTC contribution. Snapshot fields are nullable because a
// stub row can be created from a match write before the next contributions
// fetch refreshes it. unitsAllocated is the absolute total we intend TTC to
// hold; sync columns track the last confirmed write-back.
export const treematchContribution = pgTable('treematch_contribution', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  // TTC's ProjectContribution id (globally unique integer on their side).
  ttcContributionId: integer('ttc_contribution_id').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  // Donation snapshot, refreshed on every contributions fetch (display cache).
  donationGuid: text('donation_guid'),
  // Human-readable donation reference, e.g. PL-9F3K2. The only donor-facing id.
  donationRef: text('donation_ref'),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  amount: doublePrecision('amount'),
  currency: text('currency'),
  // 'automatic' | 'first' | 'manual' -- TTC-owned vocabulary, kept as text.
  allocationPriority: text('allocation_priority'),
  // Total funded centi-units; null until the first fetch refresh.
  units: integer('units'),
  // Absolute allocated total in centi-units (TreeMapper is the source of truth).
  unitsAllocated: integer('units_allocated').notNull().default(0),
  // Local ignore flag (TTC does not carry ignore yet).
  ignored: boolean('ignored').notNull().default(false),
  ignoreReason: text('ignore_reason'),
  ignoredById: integer('ignored_by_id').references(() => user.id, { onDelete: 'set null' }),
  ignoredAt: timestamp('ignored_at', { withTimezone: true }),
  // TTC write-back sync state (same idea as site.remoteSyncStatus).
  syncStatus: treematchSyncStatusEnum('sync_status').notNull().default('synced'),
  lastSyncedUnitsAllocated: integer('last_synced_units_allocated'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncError: text('sync_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectIdx: index('treematch_contribution_project_idx')
    .on(table.projectId, table.ignored)
    .where(sql`deleted_at IS NULL`),
  // Cheap sweep for rows stuck in pending/failed after a crash mid write-back.
  syncAttentionIdx: index('treematch_contribution_sync_attention_idx')
    .on(table.syncStatus)
    .where(sql`sync_status <> 'synced'`),
  unitsNonNegative: check('treematch_contribution_units_non_negative',
    sql`units IS NULL OR units >= 0`),
  allocatedNonNegative: check('treematch_contribution_allocated_non_negative',
    sql`units_allocated >= 0`),
  allocatedWithinUnits: check('treematch_contribution_allocated_within_units',
    sql`units IS NULL OR units_allocated <= units`),
  ignoredHasReason: check('treematch_contribution_ignored_has_reason',
    sql`ignored = false OR ignore_reason IS NOT NULL`),
}));

// Match ledger: how many centi-units of a contribution sit on an intervention.
// units is the current absolute amount for the pair. Unmatch = soft delete
// (deletedAt), so history stays and a later re-match inserts a fresh row.
export const treematchAllocation = pgTable('treematch_allocation', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  contributionId: integer('contribution_id').notNull()
    .references(() => treematchContribution.id, { onDelete: 'cascade' }),
  // Cascade (not restrict): interventions are soft-deleted in normal operation;
  // hard deletes only happen via the project wipe cascade, where a restrict
  // here would make the multi-path cascade fail.
  interventionId: integer('intervention_id').notNull()
    .references(() => intervention.id, { onDelete: 'cascade' }),
  // Denormalized (always the contribution's project) so project-wide stats
  // need no joins.
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  units: integer('units').notNull(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  // One ACTIVE row per pair; soft-deleted history rows do not collide.
  pairUnique: uniqueIndex('treematch_allocation_pair_unique')
    .on(table.contributionId, table.interventionId)
    .where(sql`deleted_at IS NULL`),
  interventionIdx: index('treematch_allocation_intervention_idx')
    .on(table.interventionId)
    .where(sql`deleted_at IS NULL`),
  projectIdx: index('treematch_allocation_project_idx')
    .on(table.projectId)
    .where(sql`deleted_at IS NULL`),
  unitsPositive: check('treematch_allocation_units_positive', sql`units > 0`),
}));

// Excludes an intervention from matching (e.g. re-plantings). deletedAt =
// released (unblocked); at most one active block per intervention.
export const treematchInterventionBlock = pgTable('treematch_intervention_block', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  interventionId: integer('intervention_id').notNull()
    .references(() => intervention.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  releasedById: integer('released_by_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  activeBlockUnique: uniqueIndex('treematch_block_active_unique')
    .on(table.interventionId)
    .where(sql`deleted_at IS NULL`),
  projectIdx: index('treematch_block_project_idx')
    .on(table.projectId)
    .where(sql`deleted_at IS NULL`),
}));

// Append-only TreeMatch action log (no updatedAt/deletedAt on purpose).
// units is the centi-unit delta of the action where applicable; payload
// snapshots human context (donationRef, hid, prior/new totals, error text)
// so history stays readable even if referenced rows are cleaned up.
export const treematchEvent = pgTable('treematch_event', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  type: treematchEventTypeEnum('type').notNull(),
  contributionId: integer('contribution_id')
    .references(() => treematchContribution.id, { onDelete: 'set null' }),
  // Raw external id, survives the FK being nulled out.
  ttcContributionId: integer('ttc_contribution_id'),
  interventionId: integer('intervention_id')
    .references(() => intervention.id, { onDelete: 'set null' }),
  units: integer('units'),
  // Null actor = system (e.g. a future auto-match job).
  actorId: integer('actor_id').references(() => user.id, { onDelete: 'set null' }),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectTimeIdx: index('treematch_event_project_time_idx')
    .on(table.projectId, table.occurredAt),
  contributionTimeIdx: index('treematch_event_contribution_time_idx')
    .on(table.contributionId, table.occurredAt)
    .where(sql`contribution_id IS NOT NULL`),
  interventionTimeIdx: index('treematch_event_intervention_time_idx')
    .on(table.interventionId, table.occurredAt)
    .where(sql`intervention_id IS NOT NULL`),
}));

// Auto-match rules: per-project ordered strategy list, evaluated top to
// bottom by the auto-match engine, with an implicit catch-all default
// (any donation -> oldest locations, oldest donations first) always applied
// last. Saving replaces the whole list; old rows are soft-deleted revisions.
// Vocabulary columns are text + CHECK (not pgEnum) so values can come and go
// without ALTER TYPE (e.g. a future 'payout' when-type).
export const treematchRule = pgTable('treematch_rule', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  // 0-based priority; the engine runs rules in ascending position order.
  position: integer('position').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  // Which donations the rule applies to.
  whenType: text('when_type').notNull(),
  // ISO-2 country (uppercase) for 'country'; donation ref for 'donor'.
  whenValue: text('when_value'),
  // Which plant locations to fill first.
  preferType: text('prefer_type').notNull(),
  // Cascade (not set null): set null would violate the site_required CHECK,
  // and restrict would break the project-wipe multi-path cascade (same
  // reasoning as treematch_allocation.interventionId). Sites are soft-deleted
  // in normal operation; the engine treats a soft-deleted site as matching
  // nothing.
  preferSiteId: integer('prefer_site_id').references(() => site.id, { onDelete: 'cascade' }),
  // How to order the donations the rule matches.
  orderBy: text('order_by').notNull(),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  positionUnique: uniqueIndex('treematch_rule_position_unique')
    .on(table.projectId, table.position)
    .where(sql`deleted_at IS NULL`),
  projectIdx: index('treematch_rule_project_idx')
    .on(table.projectId, table.position)
    .where(sql`deleted_at IS NULL`),
  validWhen: check('treematch_rule_valid_when',
    sql`when_type IN ('all', 'company', 'individual', 'country', 'donor')`),
  validPrefer: check('treematch_rule_valid_prefer',
    sql`prefer_type IN ('oldest', 'site', 'capacity')`),
  validOrder: check('treematch_rule_valid_order',
    sql`order_by IN ('oldest', 'largest')`),
  whenValueRequired: check('treematch_rule_when_value_required',
    sql`when_type NOT IN ('country', 'donor') OR when_value IS NOT NULL`),
  siteRequired: check('treematch_rule_site_required',
    sql`prefer_type <> 'site' OR prefer_site_id IS NOT NULL`),
}));

// One row per auto-match run. The partial unique on (project_id) WHERE
// status = 'running' doubles as the concurrency guard: a second run cannot
// start while one is in flight. rules_snapshot records the evaluated rule
// list (including the implicit default) so a run stays auditable after the
// rules are edited. Append-mostly: one UPDATE at completion, no soft delete.
export const treematchAutomatchRun = pgTable('treematch_automatch_run', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  projectId: integer('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('running'),
  // Totals in centi-units, like every other unit column.
  matchedUnits: integer('matched_units').notNull().default(0),
  contributionsMatched: integer('contributions_matched').notNull().default(0),
  interventionsFilled: integer('interventions_filled').notNull().default(0),
  rulesSnapshot: jsonb('rules_snapshot').$type<Record<string, unknown>[]>(),
  // Per-rule breakdown + flags (e.g. truncated TTC pagination).
  summary: jsonb('summary').$type<Record<string, unknown>>(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
}, (table) => ({
  activeRunUnique: uniqueIndex('treematch_automatch_run_active_unique')
    .on(table.projectId)
    .where(sql`status = 'running'`),
  projectTimeIdx: index('treematch_automatch_run_project_time_idx')
    .on(table.projectId, table.startedAt),
  validStatus: check('treematch_automatch_run_valid_status',
    sql`status IN ('running', 'completed', 'failed')`),
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
  migrationRequest: many(migrationRequest),
  speciesRequests: many(speciesRequest, { relationName: 'requestedBy' }),
  reviewedSpeciesRequests: many(speciesRequest, { relationName: 'reviewedBy' }),
  workspaceMemberships: many(workspaceMember),
  createdWorkspaces: many(workspace, { relationName: 'createdBy' }),
  sentWorkspaceInvites: many(workspaceMember, { relationName: 'invitedBy' }),
  surveys: many(survey),
  feedbacks: many(feedback),

  verifiedSpecies: many(scientificSpecies, { relationName: 'verifiedBy' }),
  uploadedImages: many(image, { relationName: 'uploadedBy' }),
  approvedInterventions: many(intervention, { relationName: 'approvedBy' }),
  rejectedInterventions: many(intervention, { relationName: 'rejectedBy' }),
  approvedSites: many(site, { relationName: 'siteApprovedBy' }),
  rejectedSites: many(site, { relationName: 'siteRejectedBy' }),
  closedReviewThreads: many(reviewThread, { relationName: 'closedBy' }),
  reviewComments: many(reviewComment, { relationName: 'commentAuthor' }),
  createdForms: many(form, { relationName: 'formCreatedBy' }),
  ignoredTreematchContributions: many(treematchContribution, { relationName: 'treematchIgnoredBy' }),
  createdTreematchAllocations: many(treematchAllocation, { relationName: 'treematchAllocationCreatedBy' }),
  createdTreematchBlocks: many(treematchInterventionBlock, { relationName: 'treematchBlockCreatedBy' }),
  releasedTreematchBlocks: many(treematchInterventionBlock, { relationName: 'treematchBlockReleasedBy' }),
  treematchEvents: many(treematchEvent, { relationName: 'treematchEventActor' }),
  createdTreematchRules: many(treematchRule, { relationName: 'treematchRuleCreatedBy' }),
  createdTreematchRuns: many(treematchAutomatchRun, { relationName: 'treematchRunCreatedBy' }),
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
  approvedBy: one(user, {
    fields: [intervention.approvedById],
    references: [user.id],
    relationName: 'approvedBy',
  }),
  rejectedBy: one(user, {
    fields: [intervention.rejectedById],
    references: [user.id],
    relationName: 'rejectedBy',
  }),
  reviewThreads: many(reviewThread),
  trees: many(tree),
  species: many(interventionSpecies),
  monitoringPlot: one(monitoringPlot),
  observations: many(plotObservation),
  groupMemberships: many(plotGroupMembership),
  treematchAllocations: many(treematchAllocation),
  treematchBlocks: many(treematchInterventionBlock),
}));

export const monitoringPlotRelations = relations(monitoringPlot, ({ one }) => ({
  intervention: one(intervention, {
    fields: [monitoringPlot.interventionId],
    references: [intervention.id],
  }),
}));

export const plotObservationRelations = relations(plotObservation, ({ one }) => ({
  intervention: one(intervention, {
    fields: [plotObservation.interventionId],
    references: [intervention.id],
  }),
}));

export const plotGroupRelations = relations(plotGroup, ({ one, many }) => ({
  project: one(project, {
    fields: [plotGroup.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [plotGroup.createdById],
    references: [user.id],
    relationName: 'createdBy',
  }),
  memberships: many(plotGroupMembership),
}));

export const plotGroupMembershipRelations = relations(plotGroupMembership, ({ one }) => ({
  group: one(plotGroup, {
    fields: [plotGroupMembership.groupId],
    references: [plotGroup.id],
  }),
  intervention: one(intervention, {
    fields: [plotGroupMembership.interventionId],
    references: [intervention.id],
  }),
}));

export const reviewThreadRelations = relations(reviewThread, ({ one, many }) => ({
  intervention: one(intervention, {
    fields: [reviewThread.interventionId],
    references: [intervention.id],
  }),
  site: one(site, {
    fields: [reviewThread.siteId],
    references: [site.id],
  }),
  closedBy: one(user, {
    fields: [reviewThread.closedById],
    references: [user.id],
    relationName: 'closedBy',
  }),
  comments: many(reviewComment),
}));

export const reviewCommentRelations = relations(reviewComment, ({ one }) => ({
  thread: one(reviewThread, {
    fields: [reviewComment.threadId],
    references: [reviewThread.id],
  }),
  author: one(user, {
    fields: [reviewComment.authorId],
    references: [user.id],
    relationName: 'commentAuthor',
  }),
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

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
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

export const migrationRequestRelation = relations(migrationRequest, ({ one, many }) => ({
  user: one(user, {
    fields: [migrationRequest.userId],
    references: [user.id],
  }),
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
  apiKey: one(projectApiKey),
  forms: many(form),
  treematchContributions: many(treematchContribution),
  treematchAllocations: many(treematchAllocation),
  treematchEvents: many(treematchEvent),
}));

export const formRelations = relations(form, ({ one }) => ({
  project: one(project, {
    fields: [form.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [form.createdById],
    references: [user.id],
    relationName: 'formCreatedBy',
  }),
}));

export const projectApiKeyRelations = relations(projectApiKey, ({ one }) => ({
  project: one(project, {
    fields: [projectApiKey.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [projectApiKey.createdById],
    references: [user.id],
  }),
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
  reviewThreads: many(reviewThread),
  approvedBy: one(user, {
    fields: [site.approvedById],
    references: [user.id],
    relationName: 'siteApprovedBy',
  }),
  rejectedBy: one(user, {
    fields: [site.rejectedById],
    references: [user.id],
    relationName: 'siteRejectedBy',
  }),
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

export const treematchContributionRelations = relations(treematchContribution, ({ one, many }) => ({
  project: one(project, {
    fields: [treematchContribution.projectId],
    references: [project.id],
  }),
  ignoredBy: one(user, {
    fields: [treematchContribution.ignoredById],
    references: [user.id],
    relationName: 'treematchIgnoredBy',
  }),
  allocations: many(treematchAllocation),
  events: many(treematchEvent),
}));

export const treematchAllocationRelations = relations(treematchAllocation, ({ one }) => ({
  contribution: one(treematchContribution, {
    fields: [treematchAllocation.contributionId],
    references: [treematchContribution.id],
  }),
  intervention: one(intervention, {
    fields: [treematchAllocation.interventionId],
    references: [intervention.id],
  }),
  project: one(project, {
    fields: [treematchAllocation.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [treematchAllocation.createdById],
    references: [user.id],
    relationName: 'treematchAllocationCreatedBy',
  }),
}));

export const treematchInterventionBlockRelations = relations(treematchInterventionBlock, ({ one }) => ({
  intervention: one(intervention, {
    fields: [treematchInterventionBlock.interventionId],
    references: [intervention.id],
  }),
  project: one(project, {
    fields: [treematchInterventionBlock.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [treematchInterventionBlock.createdById],
    references: [user.id],
    relationName: 'treematchBlockCreatedBy',
  }),
  releasedBy: one(user, {
    fields: [treematchInterventionBlock.releasedById],
    references: [user.id],
    relationName: 'treematchBlockReleasedBy',
  }),
}));

export const treematchEventRelations = relations(treematchEvent, ({ one }) => ({
  project: one(project, {
    fields: [treematchEvent.projectId],
    references: [project.id],
  }),
  contribution: one(treematchContribution, {
    fields: [treematchEvent.contributionId],
    references: [treematchContribution.id],
  }),
  intervention: one(intervention, {
    fields: [treematchEvent.interventionId],
    references: [intervention.id],
  }),
  actor: one(user, {
    fields: [treematchEvent.actorId],
    references: [user.id],
    relationName: 'treematchEventActor',
  }),
}));

export const treematchRuleRelations = relations(treematchRule, ({ one }) => ({
  project: one(project, {
    fields: [treematchRule.projectId],
    references: [project.id],
  }),
  preferSite: one(site, {
    fields: [treematchRule.preferSiteId],
    references: [site.id],
  }),
  createdBy: one(user, {
    fields: [treematchRule.createdById],
    references: [user.id],
    relationName: 'treematchRuleCreatedBy',
  }),
}));

export const treematchAutomatchRunRelations = relations(treematchAutomatchRun, ({ one }) => ({
  project: one(project, {
    fields: [treematchAutomatchRun.projectId],
    references: [project.id],
  }),
  createdBy: one(user, {
    fields: [treematchAutomatchRun.createdById],
    references: [user.id],
    relationName: 'treematchRunCreatedBy',
  }),
}));