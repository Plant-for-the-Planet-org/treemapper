const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export const postUrlApi = {
    createProject: `${baseUrl}/projects`,
    createProjectinvite: `${baseUrl}/projects`,
}

export const getUrlApi = {
    health: `${baseUrl}/health`,
    me: `${baseUrl}/api/users/me`,
    checkMigration: `${baseUrl}/api/migrate/check`,
    projects: `${baseUrl}/projects`,
}

export const patchUrlApi = {
    userMigrated: `${baseUrl}/api/users/migrated`,
    createProjectinvite: `${baseUrl}/projects`,
}
