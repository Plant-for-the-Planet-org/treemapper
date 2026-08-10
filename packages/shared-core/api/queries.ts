
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  ApiResponse, User, Project, TeamMember, Species, ProjectSpecies, Site,
  Intervention, InterventionQueryParams, Notification, ProjectInvite, InviteLink,
  DashboardKPIs, ProjectMapData, OverviewGraphData, RecentAddition, MigrationStatus,
  Organization
} from '../types/api-responses';

export const healthQueries = {
  check: async (): Promise<ApiResponse<{ status: string }>> => {
    return apiClient.get<ApiResponse<{ status: string }>>(API_ENDPOINTS.HEALTH);
  },
};

export const userQueries = {
  getMe: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<ApiResponse<User>>(API_ENDPOINTS.USER_ME);
  },
};

export const migrationQueries = {
  check: async (): Promise<ApiResponse<{ isRequired: boolean }>> => {
    return apiClient.get<ApiResponse<{ isRequired: boolean }>>(API_ENDPOINTS.MIGRATION_CHECK);
  },

  getStatus: async (): Promise<ApiResponse<MigrationStatus>> => {
    return apiClient.get<ApiResponse<MigrationStatus>>(API_ENDPOINTS.MIGRATION_STATUS);
  },
};

export const organizationQueries = {
  getAllOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    return apiClient.get<ApiResponse<Organization[]>>(API_ENDPOINTS.ORGANIZATIONS);
  },
};


export const projectQueries = {
  getMyProjects: async (): Promise<ApiResponse<Project[]>> => {
    const abc = apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.PROJECTS);
    return abc
  },

  getProjectById: async (id: string): Promise<ApiResponse<Project>> => {
    return apiClient.get<ApiResponse<Project>>(API_ENDPOINTS.PROJECT_BY_ID(id));
  },

  getProjectMembers: async (projectId: string): Promise<ApiResponse<TeamMember[]>> => {
    return apiClient.get<ApiResponse<TeamMember[]>>(API_ENDPOINTS.PROJECT_MEMBERS(projectId));
  },

  getProjectInviteLinks: async (projectId: string): Promise<ApiResponse<InviteLink[]>> => {
    return apiClient.get<ApiResponse<InviteLink[]>>(API_ENDPOINTS.PROJECT_INVITE_LINKS_LIST(projectId));
  },
};

export const inviteQueries = {
  getInviteStatus: async (uuid: string): Promise<ApiResponse<ProjectInvite>> => {
    return apiClient.get<ApiResponse<ProjectInvite>>(API_ENDPOINTS.INVITE_STATUS(uuid));
  },

  getLinkInviteStatus: async (uuid: string): Promise<ApiResponse<InviteLink>> => {
    return apiClient.get<ApiResponse<InviteLink>>(API_ENDPOINTS.INVITE_LINK_STATUS(uuid));
  },
};

export const speciesQueries = {
  searchScientific: async (query: string): Promise<ApiResponse<Species[]>> => {
    return apiClient.get<ApiResponse<Species[]>>(`${API_ENDPOINTS.SPECIES_SEARCH}?name=${query}`);
  },

  getProjectSpecies: async (projectId: string): Promise<ApiResponse<ProjectSpecies[]>> => {
    return apiClient.get<ApiResponse<ProjectSpecies[]>>(API_ENDPOINTS.PROJECT_SPECIES(projectId));
  },
};

export const siteQueries = {
  getProjectSites: async (projectId: string): Promise<ApiResponse<Site[]>> => {
    return apiClient.get<ApiResponse<Site[]>>(API_ENDPOINTS.PROJECT_SITES(projectId));
  },
};

export const interventionQueries = {
  getProjectInterventions: async (
    projectId: string,
    params?: InterventionQueryParams
  ): Promise<ApiResponse<Intervention[]>> => {
    let url = API_ENDPOINTS.PROJECT_INTERVENTIONS(projectId);
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params as any);
      url += `?${searchParams.toString()}`;
    }
    return apiClient.get<ApiResponse<Intervention[]>>(url);
  },
};

export const notificationQueries = {
  getMyNotifications: async (page: number = 1, limit: number = 20): Promise<ApiResponse<{ notifications: Notification[] }>> => {
    return apiClient.get<ApiResponse<{ notifications: Notification[] }>>(`${API_ENDPOINTS.NOTIFICATIONS}?page=${page}&limit=${limit}`);
  },
};

export const analyticsQueries = {
  getDashboardKpis: async (
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<DashboardKPIs>> => {
    return apiClient.get<ApiResponse<DashboardKPIs>>(
      `${API_ENDPOINTS.ANALYTICS_KPIS(projectId)}?startDate=${startDate}&endDate=${endDate}`
    );
  },

  getProjectMapData: async (projectId: string): Promise<ApiResponse<ProjectMapData>> => {
    return apiClient.get<ApiResponse<ProjectMapData>>(API_ENDPOINTS.ANALYTICS_MAP_DATA(projectId));
  },

  getOverviewGraph: async (
    projectId: string,
    interval: string
  ): Promise<ApiResponse<OverviewGraphData[]>> => {
    return apiClient.get<ApiResponse<OverviewGraphData[]>>(
      `${API_ENDPOINTS.ANALYTICS_OVERVIEW_GRAPH(projectId)}?interval=${interval}`
    );
  },

  getRecentAdditions: async (
    projectId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<RecentAddition[]>> => {
    return apiClient.get<ApiResponse<RecentAddition[]>>(
      `${API_ENDPOINTS.ANALYTICS_RECENT_ADDITIONS(projectId)}?page=${page}&limit=${limit}`
    );
  },
};
