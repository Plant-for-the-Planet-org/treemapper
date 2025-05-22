const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export const postUrlApi = {
    createProject: `${baseUrl}/projects`,
    createProjectinvite: `${baseUrl}/projects`,

}

export const getUrlApi = {
    health: `${baseUrl}/health`,
    me: `${baseUrl}/users/me`,
    projects: `${baseUrl}/projects`,
}
