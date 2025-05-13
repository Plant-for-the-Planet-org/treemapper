const baseUrl = 'http://192.168.0.103:3001'

export const postUrlApi = {
    createProject: `${baseUrl}/projects`,
}

export const getUrlApi = {
    health: `${baseUrl}/health`,
    me: `${baseUrl}/users/me`,
    projects: `${baseUrl}/projects`,
}
