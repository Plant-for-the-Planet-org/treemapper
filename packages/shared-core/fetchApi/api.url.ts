// packages/shared-logic/src/api/api.url.ts

/**
 * Get the base URL for API calls
 * Handles different environment variable naming conventions between Next.js and Expo
 */
function getBaseUrl(): string {
  // Next.js uses NEXT_PUBLIC_ prefix for client-side env vars
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }

  // Expo uses EXPO_PUBLIC_ prefix (Expo SDK 49+)
  if (process.env.EXPO_PUBLIC_API_ENDPOINT) {
    return process.env.EXPO_PUBLIC_API_ENDPOINT;
  }

  // Fallback for older Expo versions or manual setup
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }



  throw new Error('SERVER_URL environment variable is not configured');
}

const baseUrl = getBaseUrl();

export const postUrlApi = {
  createProject: `${baseUrl}/api/projects`,
  createProjectinvite: `${baseUrl}/api/projects`,
  acceptInvite: `${baseUrl}/api/projects/invites/accept`,
  acceptlinkInvite: `${baseUrl}/api/projects/invites/accept/link`,
  declineInvite: `${baseUrl}/api/projects/invites/decline`,
  expireInvite: `${baseUrl}/api/projects`,
  createProjectSpecies: `${baseUrl}/api/project-species`,
  requestNewSpecies: `${baseUrl}/api/species-requests`,
  createPersonalProject: `${baseUrl}/api/projects/personal`,
  startMigration: `${baseUrl}/api/migration/start`,
  createNewDashboardSite: `${baseUrl}/api/projects`,
  createNewIntervention: `${baseUrl}/api/interventions/projects`,
  createInvtiationLink: `${baseUrl}/api/projects`,
  bulkIntervention: `${baseUrl}/api/prokects`, // Note: typo in original (prokects)
  preSignUrl: `${baseUrl}/api/users/presign-url`,
  exportData: `${baseUrl}/api/analytics`,
} as const;

export const getUrlApi = {
  health: `${baseUrl}/health`,
  me: `${baseUrl}/api/users/me`,
  checkMigration: `${baseUrl}/api/migration/check`,
  projects: `${baseUrl}/api/projects`,
  inviteStatus: `${baseUrl}/api/projects/invites`,
  teamMembers: `${baseUrl}/api/projects`,
  searchSpeciesSci: `${baseUrl}/api/scientific-species/search`,
  projectSpecies: `${baseUrl}/api/project-species`,
  migrationStatus: `${baseUrl}/api/migration/status`,
  getProjectSites: `${baseUrl}/api/projects`,
  getProjectIntervnetion: `${baseUrl}/api/interventions/projects`, // Note: typo in original
  getMyNotification: `${baseUrl}/api/notifications`,
  getAllInviteLinks: `${baseUrl}/api/projects`,
  getDashboardKpis: `${baseUrl}/api/analytics/project-kpis`,
  getProjectMapData: `${baseUrl}/api/analytics`,
  getOverviewGraph: `${baseUrl}/api/analytics/planting-overview`,
  getDashboardRecentAddition: `${baseUrl}/api/analytics/recent-additions`,
} as const;

export const patchUrlApi = {
  userMigrated: `${baseUrl}/api/users/migrated`,
  updateMemeberRole: `${baseUrl}/api/projects`, // Note: typo in original (Memeber)
  markAllRead: `${baseUrl}/api/notifications/mark-all-read`,
  deleteLink: `${baseUrl}/api/projects`,
  updateProjectSettings: `${baseUrl}/api/projects`,
  userDetails: `${baseUrl}/api/users/me`,

} as const;

export const deleteUrlApi = {
  removeUser: `${baseUrl}/api/projects`,
  deletePrjSpecies: `${baseUrl}/api/project-species`,
  deletePrjIntervention: `${baseUrl}/api/interventions`,
} as const;

export const putUrlApi = {
  updatePrjSpecies: `${baseUrl}/api/project-species`,
} as const;

// Export the base URL for other modules that might need it
export { baseUrl };

// Type definitions for better TypeScript support
export type PostUrlApi = typeof postUrlApi;
export type GetUrlApi = typeof getUrlApi;
export type PatchUrlApi = typeof patchUrlApi;
export type DeleteUrlApi = typeof deleteUrlApi;
export type PutUrlApi = typeof putUrlApi;