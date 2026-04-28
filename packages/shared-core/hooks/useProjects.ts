import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectQueries } from '../api/queries';
import { projectMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { 
  QueryConfig, 
  MutationConfig, 
  CreateProjectRequest, 
  UpdateProjectSettingsRequest,
  UpdateMemberRoleRequest 
} from '../types/api-responses';

export const useMyProjects = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.myProjects(),
    queryFn: projectQueries.getMyProjects,
    select: (data) => data.data,
    ...config,
  });
};

export const useProject = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.projectDetail(projectId),
    queryFn: () => projectQueries.getProjectById(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useProjectMembers = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.projectMembers(projectId),
    queryFn: () => projectQueries.getProjectMembers(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useProjectInviteLinks = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.projectInviteLinks(projectId),
    queryFn: () => projectQueries.getProjectInviteLinks(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useCreateProject = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectMutations.create(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMyProjects(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useCreatePersonalProject = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectMutations.createPersonal(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMyProjects(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useUpdateProjectSettings = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectSettingsRequest & { projectId: string }) => 
      projectMutations.updateSettings(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectDetail(queryClient, variables.projectId);
      queryUtils.invalidateMyProjects(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useUpdateMemberRole = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMemberRoleRequest & { projectId: string; memberId: string }) => 
      projectMutations.updateMemberRole(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectMembers(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useRemoveProjectMember = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: string }) => 
      projectMutations.removeMember(projectId, memberId),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectMembers(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useExportProjectData = (config?: MutationConfig) => {
  return useMutation({
    mutationFn: ({ projectId, params }: { projectId: string; params: any }) => 
      projectMutations.exportData(projectId, params),
    onSuccess: config?.onSuccess,
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

// Helper hook for creating project titles
export const useCreateProjectTitle = () => {
  const createProjectTitle = (displayName?: string) => {
    if (!displayName) return 'My Personal Project';
    const firstName = displayName.split(' ')[0];
    return `${firstName}'s Personal Project`;
  };

  return { createProjectTitle };
};