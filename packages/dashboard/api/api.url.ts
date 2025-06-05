const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export const postUrlApi = {
    createProject: `${baseUrl}/api/projects`,
    createProjectinvite: `${baseUrl}/api/projects`,
    acceptInvite: `${baseUrl}/api/projects/invites/accept`,
    declineInvite: `${baseUrl}/api/projects/invites/decline`,
    expireInvite: `${baseUrl}/api/projects`,
    createProjectSpecies: `${baseUrl}/api/project-species`,
    createPersonalProject: `${baseUrl}/api/projects/personal`,
    startMigration: `${baseUrl}/api/migration/start`,
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
}

export const patchUrlApi = {
    userMigrated: `${baseUrl}/api/users/migrated`,
    updateMemeberRole: `${baseUrl}/api/projects`,
}


export const deleteUrlApi = {
    removeUser: `${baseUrl}/api/projects`,
    deletePrjSpecies: `${baseUrl}/api/project-species`,
}

export const putUrlApi = {
    updatePrjSpecies: `${baseUrl}/api/project-species`,
}
