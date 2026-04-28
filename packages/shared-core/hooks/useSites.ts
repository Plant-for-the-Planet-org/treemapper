import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteQueries } from '../api/queries';
import { siteMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { QueryConfig, MutationConfig, CreateSiteRequest } from '../types/api-responses';

export const useProjectSites = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.projectSites(projectId),
    queryFn: () => siteQueries.getProjectSites(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useCreateSite = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSiteRequest & { projectId: string }) => 
      siteMutations.createSite(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectSites(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};
