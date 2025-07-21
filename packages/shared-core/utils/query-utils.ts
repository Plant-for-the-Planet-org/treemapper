


import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';

export const queryUtils = {
  // Health
  invalidateHealth: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.health });
  },

  // User
  invalidateUser: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.user });
  },

  invalidateUserMe: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.userMe() });
  },

  // Migration
  invalidateMigration: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.migration });
  },

  // Projects
  invalidateProjects: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  },

  invalidateMyProjects: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.myProjects() });
  },

  invalidateProjectDetail: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectDetail(projectId) });
  },

  invalidateProjectMembers: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) });
  },

  // Invites
  invalidateInvites: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.invites });
  },

  invalidateProjectInvites: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectInvites(projectId) });
  },

  invalidateProjectInviteLinks: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectInviteLinks(projectId) });
  },

  // Species
  invalidateSpecies: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.species });
  },

  invalidateProjectSpecies: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectSpecies(projectId) });
  },

  // Sites
  invalidateSites: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.sites });
  },

  invalidateProjectSites: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projectSites(projectId) });
  },

  // Interventions
  invalidateInterventions: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.interventions });
  },

  invalidateProjectInterventions: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.interventions,
      predicate: (query) =>
        query.queryKey[0] === 'interventions' &&
        query.queryKey[1] === 'project' &&
        query.queryKey[2] === projectId
    });
  },

  // Notifications
  invalidateNotifications: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  },

  invalidateMyNotifications: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.notifications,
      predicate: (query) => query.queryKey[0] === 'notifications' && query.queryKey[1] === 'my'
    });
  },

  // Analytics
  invalidateAnalytics: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  },

  invalidateProjectAnalytics: (queryClient: QueryClient, projectId: string) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.analytics,
      predicate: (query) =>
        query.queryKey[0] === 'analytics' &&
        query.queryKey.includes(projectId)
    });
  },

  // Prefetch utilities
  prefetchMyProjects: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.myProjects(),
      queryFn: () => import('../api/queries').then(m => m.projectQueries.getMyProjects()),
    });
  },

  prefetchProjectDetail: (queryClient: QueryClient, projectId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.projectDetail(projectId),
      queryFn: () => import('../api/queries').then(m => m.projectQueries.getProjectById(projectId)),
    });
  },

  invalidateOrganizations: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
  },

  invalidateOrganizationsList: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.allOrgs() });
  },

  invalidateOrganizationDetail: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orgDetail(id) });
  },

};
