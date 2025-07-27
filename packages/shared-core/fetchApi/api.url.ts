// packages/shared-logic/src/api.url.ts

/**
 * Get the base URL for API calls
 * Handles different environment variable naming conventions between Next.js and Expo
 */
function getBaseUrl(): string {
  // For mobile/Expo apps, use the full URL
  if (process.env.EXPO_PUBLIC_API_ENDPOINT) {
    return process.env.EXPO_PUBLIC_API_ENDPOINT;
  }

  // For web apps (both client and server), use Next.js proxy
  // This works for both SSR and client-side calls
  return `${process.env.NEXT_PUBLIC_SERVER_URL}/api`;
}

const baseUrl = getBaseUrl();

export const postUrlApi = {
  createProject: `${baseUrl}/projects`,
  createProjectinvite: `${baseUrl}/projects`,
  acceptInvite: `${baseUrl}/projects/invites/accept`,
  acceptlinkInvite: `${baseUrl}/projects/invites/accept/link`,
  declineInvite: `${baseUrl}/projects/invites/decline`,
  expireInvite: `${baseUrl}/projects`,
  createProjectSpecies: `${baseUrl}/project-species`,
  requestNewSpecies: `${baseUrl}/species-requests`,
  createPersonalProject: `${baseUrl}/projects/personal`,
  startMigration: `${baseUrl}/migration/start`,
  createNewDashboardSite: `${baseUrl}/projects`,
  createNewIntervention: `${baseUrl}/interventions/projects`,
  createInvtiationLink: `${baseUrl}/projects`,
  bulkIntervention: `${baseUrl}/prokects`, // Note: typo in original (prokects)
  preSignUrl: `${baseUrl}/users/presign-url`,
  exportData: `${baseUrl}/analytics`,
  createNewOrg: `${baseUrl}/organizations`,
  selectOrg: `${baseUrl}/organizations/primary`,
  onboarding: `${baseUrl}/users/onboarding`
} as const;


export const getUrlApi = {
  health: `${baseUrl}/health`,
  me: `${baseUrl}/users/me`,
  checkMigration: `${baseUrl}/migration/check`,
  projects: `${baseUrl}/projects`,
  workspce: `${baseUrl}/projects/workspace`,
  inviteStatus: `${baseUrl}/projects/invites`,
  teamMembers: `${baseUrl}/projects`,
  searchSpeciesSci: `${baseUrl}/scientific-species/search`,
  projectSpecies: `${baseUrl}/project-species`,
  migrationStatus: `${baseUrl}/migration/status`,
  getProjectSites: `${baseUrl}/projects`,
  getProjectIntervnetion: `${baseUrl}/interventions/projects`, // Note: typo in original
  getMyNotification: `${baseUrl}/notifications`,
  getAllInviteLinks: `${baseUrl}/projects`,
  getDashboardKpis: `${baseUrl}/analytics/project-kpis`,
  getProjectMapData: `${baseUrl}/analytics`,
  getOverviewGraph: `${baseUrl}/analytics/planting-overview`,
  getDashboardRecentAddition: `${baseUrl}/analytics/recent-additions`,
  getMyOrgs: `${baseUrl}/organizations`,
} as const;

export const patchUrlApi = {
  userMigrated: `${baseUrl}/users/migrated`,
  updateMemeberRole: `${baseUrl}/projects`, // Note: typo in original (Memeber)
  markAllRead: `${baseUrl}/notifications/mark-all-read`,
  deleteLink: `${baseUrl}/projects`,
  updateProjectSettings: `${baseUrl}/projects`,
  userDetails: `${baseUrl}/users/me`,

} as const;

export const deleteUrlApi = {
  removeUser: `${baseUrl}/projects`,
  deletePrjSpecies: `${baseUrl}/project-species`,
  deletePrjIntervention: `${baseUrl}/interventions`,
} as const;

export const putUrlApi = {
  updatePrjSpecies: `${baseUrl}/project-species`,
} as const;

// Export the base URL for other modules that might need it
export { baseUrl };

// Type definitions for better TypeScript support
export type PostUrlApi = typeof postUrlApi;
export type GetUrlApi = typeof getUrlApi;
export type PatchUrlApi = typeof patchUrlApi;
export type DeleteUrlApi = typeof deleteUrlApi;
export type PutUrlApi = typeof putUrlApi;