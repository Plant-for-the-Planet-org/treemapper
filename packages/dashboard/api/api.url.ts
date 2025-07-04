const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

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
    bulkIntervention: `${baseUrl}/api/prokects`,
    preSignUrl: `${baseUrl}/api/users/presign-url`,
    exportData: `${baseUrl}/api/analytics`,
}

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
    getProjectIntervnetion: `${baseUrl}/api/interventions/projects`,
    getMyNotification: `${baseUrl}/api/notifications`,
    getAllInviteLinks: `${baseUrl}/api/projects`,
    getDashboardKpis: `${baseUrl}/api/analytics/project-kpis`,
    getOverviewGraph: `${baseUrl}/api/analytics/planting-overview`,
    getDashboardRecentAddition: `${baseUrl}/api/analytics/recent-additions`,
}

export const patchUrlApi = {
    userMigrated: `${baseUrl}/api/users/migrated`,
    updateMemeberRole: `${baseUrl}/api/projects`,
    markAllRead: `${baseUrl}/api/notifications/mark-all-read`,
    deleteLink: `${baseUrl}/api/projects`,
    updateProjectSettings: `${baseUrl}/api/projects`,
}


export const deleteUrlApi = {
    removeUser: `${baseUrl}/api/projects`,
    deletePrjSpecies: `${baseUrl}/api/project-species`,
}

export const putUrlApi = {
    updatePrjSpecies: `${baseUrl}/api/project-species`,
}
