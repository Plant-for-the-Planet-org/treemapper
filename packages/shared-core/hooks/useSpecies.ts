import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { speciesQueries } from '../api/queries';
import { speciesMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { 
  QueryConfig, 
  MutationConfig, 
  CreateProjectSpeciesRequest,
  UpdateProjectSpeciesRequest 
} from '../types/api-responses';

export const useSpeciesSearch = (query: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.speciesSearch(query),
    queryFn: () => speciesQueries.searchScientific(query),
    select: (data) => data.data,
    enabled: !!query && query.length > 2, // Only search when query has 3+ characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...config,
  });
};

export const useProjectSpecies = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.projectSpecies(projectId),
    queryFn: () => speciesQueries.getProjectSpecies(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    ...config,
  });
};

export const useCreateProjectSpecies = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectSpeciesRequest & { projectId: string }) => 
      speciesMutations.createProjectSpecies(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectSpecies(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useUpdateProjectSpecies = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectSpeciesRequest & { projectId: string; speciesId: string }) => 
      speciesMutations.updateProjectSpecies(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectSpecies(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useRemoveProjectSpecies = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, speciesId }: { projectId: string; speciesId: string }) => 
      speciesMutations.removeProjectSpecies(projectId, speciesId),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectSpecies(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useRequestNewSpecies = (config?: MutationConfig) => {
  return useMutation({
    mutationFn: (data: any & { projectId: string }) => 
      speciesMutations.requestNewSpecies(data),
    onSuccess: config?.onSuccess,
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};