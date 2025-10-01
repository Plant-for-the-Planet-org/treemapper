import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionQueries } from '../api/queries';
import { interventionMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { 
  QueryConfig, 
  MutationConfig, 
  CreateInterventionRequest,
  InterventionQueryParams 
} from '../types/api-responses';

export const useProjectInterventions = (
  projectId: string, 
  params?: InterventionQueryParams,
  config?: QueryConfig
) => {
  return useQuery({
    queryKey: queryKeys.projectInterventions(projectId, params),
    queryFn: () => interventionQueries.getProjectInterventions(projectId, params),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useCreateIntervention = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInterventionRequest & { projectId: string }) => 
      interventionMutations.create(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInterventions(queryClient, variables.projectId);
      // Also invalidate analytics as new intervention affects KPIs
      queryUtils.invalidateProjectAnalytics(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useCreateBulkIntervention = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any & { projectId: string }) => 
      interventionMutations.createBulk(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInterventions(queryClient, variables.projectId);
      queryUtils.invalidateProjectAnalytics(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useDeleteIntervention = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, interventionId }: { projectId: string; interventionId: string }) => 
      interventionMutations.delete(projectId, interventionId),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInterventions(queryClient, variables.projectId);
      queryUtils.invalidateProjectAnalytics(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};