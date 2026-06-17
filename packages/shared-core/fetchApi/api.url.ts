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
  return '/api/server';
}

const baseUrl = getBaseUrl();

export const postUrlApi = {
  createProject: `${baseUrl}/projects`,
  addProjectImage: `${baseUrl}/projects`,
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
  selectOrg: `${baseUrl}/workspace/primary`,
  onboarding: `${baseUrl}/users/onboarding`,
  grantSiteAccess: `${baseUrl}/projects`,
  revokeSiteAccess: `${baseUrl}/projects`,
  // Approval Board APIs - new endpoints
  getReviewQueue: `${baseUrl}/approval-board/projects`,
  getInterventionReviewDetails: `${baseUrl}/approval-board/interventions`,
  getInterventionThreads: `${baseUrl}/approval-board/interventions`,
  getCurrentThread: `${baseUrl}/approval-board/interventions`,
  getThreadComments: `${baseUrl}/approval-board/threads`,
  submitForReview: `${baseUrl}/approval-board/interventions`,
  resubmitForReview: `${baseUrl}/approval-board/interventions`,
  submitReviewDecision: `${baseUrl}/approval-board/projects`,
  publishIntervention: `${baseUrl}/approval-board/projects`,
  unpublishIntervention: `${baseUrl}/approval-board/projects`,
  addAdminComment: `${baseUrl}/approval-board/projects`,
  addFieldWorkerComment: `${baseUrl}/approval-board/threads`,
  markIssueAddressed: `${baseUrl}/approval-board/comments`,
  resolveIssue: `${baseUrl}/approval-board/projects`,
  getUserReviewSummary: `${baseUrl}/approval-board/users/me/summary`,
  // Site approval
  submitSiteReviewDecision: `${baseUrl}/approval-board/projects`,
  addAdminSiteComment: `${baseUrl}/approval-board/projects`,
  addFieldWorkerSiteComment: `${baseUrl}/approval-board/sites`,
  generateProjectApiKey: `${baseUrl}/projects`,
  // Forms (project-scoped)
  projectForms: `${baseUrl}/projects`,
  // Device management (project-scoped)
  notifyProjectDevices: `${baseUrl}/projects`,
} as const;


export const getUrlApi = {
  health: `${baseUrl}/health`,
  getProjectImages: `${baseUrl}/projects`,
  me: `${baseUrl}/users/me`,
  checkMigration: `${baseUrl}/migration/check`,
  projects: `${baseUrl}/projects/workspace`,
  singleproject: `${baseUrl}/projects`,
  workspce: `${baseUrl}/projects`,
  projectMemebers: `${baseUrl}/projects/member`,
  inviteStatus: `${baseUrl}/projects/invites`,
  teamMembers: `${baseUrl}/projects`,
  searchSpeciesSci: `${baseUrl}/scientific-species/search`,
  projectSpecies: `${baseUrl}/project-species`,
  migrationStatus: `${baseUrl}/migration/status`,
  getProjectSites: `${baseUrl}/projects`,
  getProjectIntervnetion: `${baseUrl}/interventions/projects`,
  getMyNotification: `${baseUrl}/notifications`,
  getAllInviteLinks: `${baseUrl}/projects`,
  getDashboardKpis: `${baseUrl}/analytics/project-kpis`,
  getProjectMapData: `${baseUrl}/analytics`,
  getOverviewGraph: `${baseUrl}/analytics/planting-overview`,
  getDashboardRecentAddition: `${baseUrl}/analytics/recent-additions`,
  getMyOrgs: `${baseUrl}/organizations`,
  getSiteMembers: `${baseUrl}/projects`,
  getWrokspaceMembers: `${baseUrl}/workspace/members`,
  getWorkspace: `${baseUrl}/workspace`,
  getWorkspaceSettings: `${baseUrl}/workspace`,
  getMyAdminWorkspaces: `${baseUrl}/workspace/my`,
  getWorkspaceMembers: `${baseUrl}/workspace`,
  getWorkspaceProjects: `${baseUrl}/workspace`,
  getAllWorkspaces: `${baseUrl}/workspace/all`,
  getProjectMap: `${baseUrl}/interventions`,
  getProjectTreeMap: `${baseUrl}/interventions`,
  getSiteInterventionsMap: `${baseUrl}/interventions`,
  getProjectSitesMap: `${baseUrl}/projects`,
  getProjectAnalytics: `${baseUrl}/analytics`,
  getApprovalBoard: `${baseUrl}/interventions/approval/board`,
  getProjectRequiresApproval: `${baseUrl}/approval-board/projects`,
  getWorkspaceAuditLogs: `${baseUrl}/audit/workspace`,
  // Approval Board GET endpoints
  getReviewQueue: `${baseUrl}/approval-board/projects`,
  getInterventionReviewDetails: `${baseUrl}/approval-board/interventions`,
  getInterventionThreads: `${baseUrl}/approval-board/interventions`,
  getCurrentThread: `${baseUrl}/approval-board/interventions`,
  getThreadComments: `${baseUrl}/approval-board/threads`,
  getUserReviewSummary: `${baseUrl}/approval-board/users/me/summary`,
  // Site approval
  getSiteReviewQueue: `${baseUrl}/approval-board/projects`,
  getCurrentSiteThread: `${baseUrl}/approval-board/sites`,
  getTreeRecords: `${baseUrl}/interventions/trees`,
  // Workspace-level approval queues
  getWorkspaceReviewQueue: `${baseUrl}/approval-board/workspaces`,
  getWorkspaceSiteReviewQueue: `${baseUrl}/approval-board/workspaces`,
  projectApiKey: `${baseUrl}/projects`,
  // Monitoring plots (shared base for all verbs)
  monitoringPlots: `${baseUrl}/monitoring-plots`,
  // Forms (project-scoped; shared base for all verbs)
  projectForms: `${baseUrl}/projects`,
  // Device management (project-scoped)
  projectDevices: `${baseUrl}/projects`,
} as const;

export const patchUrlApi = {
  userMigrated: `${baseUrl}/users/migrated`,
  updateWorkspace: `${baseUrl}/workspace`,
  updateWorkspaceSettings: `${baseUrl}/workspace`,
  updateProjectStatus: `${baseUrl}/workspace`,
  transferProject: `${baseUrl}/workspace`,
  updateMemeberRole: `${baseUrl}/projects`,
  markAllRead: `${baseUrl}/notifications/mark-all-read`,
  markRead: `${baseUrl}/notifications`,
  deleteLink: `${baseUrl}/projects`,
  updateProjectSettings: `${baseUrl}/projects`,
  userDetails: `${baseUrl}/users/me`,
  // Forms (project-scoped)
  projectForms: `${baseUrl}/projects`,

} as const;

export const deleteUrlApi = {
  removeUser: `${baseUrl}/projects`,
  deletePrjSpecies: `${baseUrl}/project-species`,
  deletePrjIntervention: `${baseUrl}/interventions`,
  deleteProject: `${baseUrl}/projects`,
  deleteProjectImage: `${baseUrl}/projects`,
  revokeProjectApiKey: `${baseUrl}/projects`,
  // Forms (project-scoped)
  projectForms: `${baseUrl}/projects`,
} as const;

export const putUrlApi = {
  updatePrjSpecies: `${baseUrl}/project-species`,
  updateSiteData: `${baseUrl}/projects`,
  avatarUpdate: `${baseUrl}/users/avatar`,
  updateFavSpecies: `${baseUrl}/project-species`,
  impersonateUser: `${baseUrl}/workspace/impersonate`,
  impersonateUserExit: `${baseUrl}/workspace/impersonate/exit`,
  speicesDataUpdate: `${baseUrl}/interventions`,
  bulkUpdateSpecies: `${baseUrl}/interventions/projects`,
  ownershipTransfer: `${baseUrl}/interventions`,
  editIntervention: `${baseUrl}/interventions`,
  editTree: `${baseUrl}/interventions/trees`,
  addTreeRemeasurement: `${baseUrl}/interventions/trees`,

} as const;

// Export the base URL for other modules that might need it
export { baseUrl };

// Type definitions for better TypeScript support
export type PostUrlApi = typeof postUrlApi;
export type GetUrlApi = typeof getUrlApi;
export type PatchUrlApi = typeof patchUrlApi;
export type DeleteUrlApi = typeof deleteUrlApi;
export type PutUrlApi = typeof putUrlApi;