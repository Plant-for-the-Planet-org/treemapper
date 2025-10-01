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

  organizations: ['organizations'] as const,
  allOrgs: () => [...queryKeys.organizations, 'list'] as const,
  orgDetail: (id: string) => [...queryKeys.organizations, 'detail', id] as const,
  orgMembers: (orgId: string) => [...queryKeys.organizations, orgId, 'members'] as const,
} as const;
