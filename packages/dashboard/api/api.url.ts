const baseUrl = 'http://192.168.0.103:3001'

export const postUrlApi = {
    health: `${baseUrl}/health`,
    login: `${baseUrl}/login`,
    register: `${baseUrl}/register`,
    createProject: `${baseUrl}/projects`,
    getProjects: `${baseUrl}/projects`,
    getProjectById: (id: string) => `${baseUrl}/projects/${id}`,
    updateProjectById: (id: string) => `${baseUrl}/projects/${id}`,
    deleteProjectById: (id: string) => `${baseUrl}/projects/${id}`,
    getProjectMembersById: (id: string) => `${baseUrl}/projects/${id}/members`,
    addProjectMemberById: (id: string) => `${baseUrl}/projects/${id}/members`,
    removeProjectMemberById: (id: string) => `${baseUrl}/projects/${id}/members`,
}

export const getUrlApi = {
    health: `${baseUrl}/health`,
    me: `${baseUrl}/users/me`,
}
