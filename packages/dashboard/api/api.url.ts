const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export const postUrlApi = {
    createProject: `${baseUrl}/api/projects`,
    createProjectinvite: `${baseUrl}/api/projects`,
    acceptInvite: `${baseUrl}/api/projects/invites/accept`,
    declineInvite: `${baseUrl}/api/projects/invites/decline`,
    expireInvite: `${baseUrl}/api/projects`,
}

export const getUrlApi = {
    health: `${baseUrl}/health`,
    me: `${baseUrl}/api/users/me`,
    checkMigration: `${baseUrl}/api/migrate/check`,
    projects: `${baseUrl}/api/projects`,
    inviteStatus: `${baseUrl}/api/projects/invites`,
    teamMembers: `${baseUrl}/api/projects`,
}

export const patchUrlApi = {
    userMigrated: `${baseUrl}/api/users/migrated`,
    updateMemeberRole: `${baseUrl}/api/projects`,
}


export const deleteUrlApi = {
    removeUser: `${baseUrl}/api/projects`,
    // createProjectinvite: `${baseUrl}/projects`,
}
