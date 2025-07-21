




import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  ApiResponse, CreateProjectRequest, UpdateProjectSettingsRequest, UpdateUserRequest,
  PreSignUrlRequest, PreSignUrlResponse, CreateInviteRequest, CreateInviteLinkRequest,
  AcceptInviteRequest, CreateProjectSpeciesRequest, UpdateProjectSpeciesRequest,
  CreateSiteRequest, CreateInterventionRequest, UpdateMemberRoleRequest,
  StartMigrationRequest,
  CreateOrganizationRequest,
  Intervention,
  InviteLink,
  MigrationStatus,
  Organization,
  Project,
  ProjectInvite,
  ProjectSpecies,
  Site,
  User
} from '../types/api-responses';

export const organizationMutations = {
  createOrganization: async (data: CreateOrganizationRequest): Promise<ApiResponse<Organization>> => {
    return apiClient.post<ApiResponse<Organization>>(API_ENDPOINTS.ORGANIZATIONS, data);
  },
  updateOrganization: async ({ id, ...data }: Partial<Organization> & { id: string }): Promise<ApiResponse<Organization>> => {
    return apiClient.put<ApiResponse<Organization>>(API_ENDPOINTS.ORGANIZATION_BY_ID(id), data);
  },
};


export const userMutations = {
  updateDetails: async (data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    return apiClient.patch<ApiResponse<User>>(API_ENDPOINTS.USER_ME, data);
  },

  generatePreSignUrl: async (data: PreSignUrlRequest): Promise<ApiResponse<PreSignUrlResponse>> => {
    return apiClient.post<ApiResponse<PreSignUrlResponse>>(API_ENDPOINTS.USER_PRESIGN_URL, data);
  },

  updateMigrated: async (data: any): Promise<ApiResponse<void>> => {
    return apiClient.put<ApiResponse<void>>(API_ENDPOINTS.USER_MIGRATED, data);
  },
};

export const migrationMutations = {
  start: async (data: StartMigrationRequest): Promise<ApiResponse<MigrationStatus>> => {
    return apiClient.post<ApiResponse<MigrationStatus>>(API_ENDPOINTS.MIGRATION_START, data);
  },
};

export const projectMutations = {
  create: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    return apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.PROJECTS, data);
  },

  createPersonal: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    console.log("J", data)
    const ks = apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.PROJECTS_PERSONAL, data);
    console.log("J", await ks)
    return ks
  },

  updateSettings: async ({
    projectId,
    ...data
  }: UpdateProjectSettingsRequest & { projectId: string }): Promise<ApiResponse<Project>> => {
    return apiClient.patch<ApiResponse<Project>>(API_ENDPOINTS.PROJECT_SETTINGS(projectId), data);
  },

  updateMemberRole: async ({
    projectId,
    memberId,
    ...data
  }: UpdateMemberRoleRequest & { projectId: string; memberId: string }): Promise<ApiResponse<void>> => {
    return apiClient.patch<ApiResponse<void>>(
      API_ENDPOINTS.PROJECT_MEMBER_ROLE(projectId, memberId),
      data
    );
  },

  removeMember: async (projectId: string, memberId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.PROJECT_REMOVE_MEMBER(projectId, memberId)
    );
  },

  exportData: async (projectId: string, params: any): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ANALYTICS_EXPORT(projectId), params);
  },
};

export const inviteMutations = {
  createInvite: async ({
    projectId,
    ...data
  }: CreateInviteRequest & { projectId: string }): Promise<ApiResponse<ProjectInvite>> => {
    return apiClient.post<ApiResponse<ProjectInvite>>(
      API_ENDPOINTS.PROJECT_INVITES(projectId),
      data
    );
  },

  createInviteLink: async ({
    projectId,
    ...data
  }: CreateInviteLinkRequest & { projectId: string }): Promise<ApiResponse<InviteLink>> => {
    return apiClient.post<ApiResponse<InviteLink>>(
      API_ENDPOINTS.PROJECT_INVITE_LINKS(projectId),
      data
    );
  },

  acceptInvite: async (data: AcceptInviteRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.INVITE_ACCEPT, data);
  },

  acceptLinkInvite: async (data: AcceptInviteRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.INVITE_ACCEPT_LINK, data);
  },

  declineInvite: async (data: AcceptInviteRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.INVITE_DECLINE, data);
  },

  expireInvite: async (projectId: string, data: any): Promise<ApiResponse<void>> => {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.INVITE_EXPIRE(projectId), data);
  },

  removeInviteLink: async (projectId: string, inviteId: string): Promise<ApiResponse<void>> => {
    return apiClient.patch<ApiResponse<void>>(
      API_ENDPOINTS.INVITE_LINK_DELETE(projectId, inviteId),
      {}
    );
  },
};

export const speciesMutations = {
  createProjectSpecies: async ({
    projectId,
    ...data
  }: CreateProjectSpeciesRequest & { projectId: string }): Promise<ApiResponse<ProjectSpecies>> => {
    return apiClient.post<ApiResponse<ProjectSpecies>>(
      API_ENDPOINTS.PROJECT_SPECIES_CREATE(projectId),
      data
    );
  },

  updateProjectSpecies: async ({
    projectId,
    speciesId,
    ...data
  }: UpdateProjectSpeciesRequest & {
    projectId: string;
    speciesId: string;
  }): Promise<ApiResponse<ProjectSpecies>> => {
    return apiClient.put<ApiResponse<ProjectSpecies>>(
      API_ENDPOINTS.PROJECT_SPECIES_UPDATE(projectId, speciesId),
      data
    );
  },

  removeProjectSpecies: async (projectId: string, speciesId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.PROJECT_SPECIES_DELETE(projectId, speciesId)
    );
  },

  requestNewSpecies: async ({
    projectId,
    ...data
  }: any & { projectId: string }): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.SPECIES_REQUEST(projectId), data);
  },
};

export const siteMutations = {
  createSite: async ({
    projectId,
    ...data
  }: CreateSiteRequest & { projectId: string }): Promise<ApiResponse<Site>> => {
    return apiClient.post<ApiResponse<Site>>(API_ENDPOINTS.PROJECT_SITES(projectId), data);
  },
};

export const interventionMutations = {
  create: async ({
    projectId,
    ...data
  }: CreateInterventionRequest & { projectId: string }): Promise<ApiResponse<Intervention>> => {
    return apiClient.post<ApiResponse<Intervention>>(
      API_ENDPOINTS.PROJECT_INTERVENTIONS_WEB(projectId),
      data
    );
  },

  createBulk: async ({
    projectId,
    ...data
  }: any & { projectId: string }): Promise<ApiResponse<Intervention[]>> => {
    return apiClient.post<ApiResponse<Intervention[]>>(
      API_ENDPOINTS.PROJECT_INTERVENTIONS_BULK(projectId),
      data
    );
  },

  delete: async (projectId: string, interventionId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.INTERVENTION_DELETE(projectId, interventionId)
    );
  },
};

export const notificationMutations = {
  markAllRead: async (): Promise<ApiResponse<void>> => {
    return apiClient.patch<ApiResponse<void>>(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ, {});
  },
};
