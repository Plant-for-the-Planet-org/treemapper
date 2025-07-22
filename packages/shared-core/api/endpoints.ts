export const getBaseUrl = (): string => {
  return '/'
};

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"

export const API_ENDPOINTS = {
  // Health
  HEALTH: `${baseUrl}/health`,

  ORGANIZATIONS: '/api/organizations',
  ORGANIZATION_BY_ID: (id: string) => `${baseUrl}/api/projects/${id}`,
  // User
  USER_ME: `${baseUrl}/api/users/me`,
  USER_PRESIGN_URL: `${baseUrl}/api/users/presign-url`,
  USER_MIGRATED: `${baseUrl}/api/users/migrated`,

  // Migration
  MIGRATION_CHECK: `${baseUrl}/api/migration/check`,
  MIGRATION_STATUS: `${baseUrl}/api/migration/status`,
  MIGRATION_START: `${baseUrl}/api/migration/start`,

  // Projects
  PROJECTS: `${baseUrl}/api/projects`,
  PROJECTS_PERSONAL: `${baseUrl}/api/projects/personal`,
  PROJECT_BY_ID: (id: string) => `${baseUrl}/api/projects/${id}`,
  PROJECT_SETTINGS: (id: string) => `${baseUrl}/api/projects/${id}`,
  PROJECT_MEMBERS: (id: string) => `${baseUrl}/api/projects/${id}/allmembers`,
  PROJECT_MEMBER_ROLE: (projectId: string, memberId: string) =>
    `${baseUrl}/api/projects/${projectId}/members/${memberId}/role`,
  PROJECT_REMOVE_MEMBER: (projectId: string, memberId: string) =>
    `${baseUrl}/api/projects/${projectId}/members/${memberId}`,

  // Project Invites
  PROJECT_INVITES: (projectId: string) => `${baseUrl}/api/projects/${projectId}/invites`,
  PROJECT_INVITE_LINKS: (projectId: string) => `${baseUrl}/api/projects/${projectId}/invites/link`,
  PROJECT_INVITE_LINKS_LIST: (projectId: string) => `${baseUrl}/api/projects/${projectId}/links`,
  INVITE_ACCEPT: `${baseUrl}/api/projects/invites/accept`,
  INVITE_ACCEPT_LINK: `${baseUrl}/api/projects/invites/accept/link`,
  INVITE_DECLINE: `${baseUrl}/api/projects/invites/decline`,
  INVITE_EXPIRE: (projectId: string) => `${baseUrl}/api/projects/${projectId}/invites/expire`,
  INVITE_STATUS: (uuid: string) => `${baseUrl}/api/projects/invites/${uuid}/status`,
  INVITE_LINK_STATUS: (uuid: string) => `${baseUrl}/api/projects/invites/${uuid}/status/link`,
  INVITE_LINK_DELETE: (projectId: string, inviteId: string) =>
    `${baseUrl}/api/projects/${projectId}/invites/${inviteId}/link`,

  // Species
  SPECIES_SEARCH: `${baseUrl}/api/scientific-species/search`,
  PROJECT_SPECIES: (projectId: string) => `${baseUrl}/api/project-species/${projectId}`,
  PROJECT_SPECIES_CREATE: (projectId: string) => `${baseUrl}/api/project-species/${projectId}`,
  PROJECT_SPECIES_UPDATE: (projectId: string, speciesId: string) =>
    `${baseUrl}/api/project-species/${projectId}/species/${speciesId}`,
  PROJECT_SPECIES_DELETE: (projectId: string, speciesId: string) =>
    `${baseUrl}/api/project-species/${projectId}/species/${speciesId}`,
  SPECIES_REQUEST: (projectId: string) => `${baseUrl}/api/species-requests/${projectId}`,

  // Sites
  PROJECT_SITES: (projectId: string) => `${baseUrl}/api/projects/${projectId}/sites`,

  // Interventions
  PROJECT_INTERVENTIONS: (projectId: string) => `${baseUrl}/api/interventions/projects/${projectId}`,
  PROJECT_INTERVENTIONS_WEB: (projectId: string) => `${baseUrl}/api/interventions/projects/${projectId}/web`,
  PROJECT_INTERVENTIONS_BULK: (projectId: string) => `${baseUrl}/api/interventions/projects/${projectId}/bulk`,
  INTERVENTION_DELETE: (projectId: string, interventionId: string) =>
    `${baseUrl}/api/interventions/${projectId}/${interventionId}`,

  // Notifications
  NOTIFICATIONS: `${baseUrl}/api/notifications`,
  NOTIFICATIONS_MARK_ALL_READ: `${baseUrl}/api/notifications/mark-all-read`,

  // Analytics
  ANALYTICS_KPIS: (projectId: string) => `${baseUrl}/api/analytics/project-kpis/${projectId}`,
  ANALYTICS_MAP_DATA: (projectId: string) => `${baseUrl}/api/analytics/${projectId}/map`,
  ANALYTICS_OVERVIEW_GRAPH: (projectId: string) => `${baseUrl}/api/analytics/planting-overview/${projectId}`,
  ANALYTICS_RECENT_ADDITIONS: (projectId: string) => `${baseUrl}/api/analytics/recent-additions/${projectId}`,
  ANALYTICS_EXPORT: (projectId: string) => `${baseUrl}/api/analytics/${projectId}/export`,
} as const;

// packages/shared-core/api/query-keys.ts
export const queryKeys = {
  // Health
  health: ['health'] as const,

  // User
  user: ['user'] as const,
  userMe: () => [...queryKeys.user, 'me'] as const,

  // Migration
  migration: ['migration'] as const,
  migrationCheck: () => [...queryKeys.migration, 'check'] as const,
  migrationStatus: () => [...queryKeys.migration, 'status'] as const,

  // Projects
  projects: ['projects'] as const,
  myProjects: () => [...queryKeys.projects, 'my'] as const,
  projectDetail: (id: string) => [...queryKeys.projects, 'detail', id] as const,
  projectMembers: (projectId: string) => [...queryKeys.projects, projectId, 'members'] as const,

  // Invites
  invites: ['invites'] as const,
  projectInvites: (projectId: string) => [...queryKeys.invites, 'project', projectId] as const,
  projectInviteLinks: (projectId: string) => [...queryKeys.invites, 'links', projectId] as const,
  inviteStatus: (uuid: string) => [...queryKeys.invites, 'status', uuid] as const,

  // Species
  species: ['species'] as const,
  speciesSearch: (query: string) => [...queryKeys.species, 'search', query] as const,
  projectSpecies: (projectId: string) => [...queryKeys.species, 'project', projectId] as const,

  // Sites
  sites: ['sites'] as const,
  projectSites: (projectId: string) => [...queryKeys.sites, 'project', projectId] as const,

  // Interventions
  interventions: ['interventions'] as const,
  projectInterventions: (projectId: string, params?: any) => [
    ...queryKeys.interventions, 'project', projectId, params
  ] as const,

  // Notifications
  notifications: ['notifications'] as const,
  myNotifications: (page: number, limit: number) => [...queryKeys.notifications, 'my', page, limit] as const,

  // Analytics
  analytics: ['analytics'] as const,
  analyticsKpis: (projectId: string, startDate: string, endDate: string) => [
    ...queryKeys.analytics, 'kpis', projectId, startDate, endDate
  ] as const,
  analyticsMapData: (projectId: string) => [...queryKeys.analytics, 'map', projectId] as const,
  analyticsOverviewGraph: (projectId: string, interval: string) => [
    ...queryKeys.analytics, 'overview', projectId, interval
  ] as const,
  analyticsRecentAdditions: (projectId: string, page: number, limit: number) => [
    ...queryKeys.analytics, 'recent', projectId, page, limit
  ] as const,
} as const;
