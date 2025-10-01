import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationQueries } from '../api/queries';
import { organizationMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { CreateOrganizationRequest} from '../types/api-responses';
import {QueryConfig, MutationConfig } from '../types/query-types'

export const useOrganizations = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.allOrgs(),
    queryFn: organizationQueries.getAllOrganizations,
    ...config,
  });
};



export const useCreateOrganization = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => organizationMutations.createOrganization(data),
    onSuccess: (data) => {
      // Invalidate and refetch organizations list
      queryUtils.invalidateOrganizationsList(queryClient);
      config?.onSuccess?.(data);
    },
    onError: config?.onError,
  });
};

export const useUpdateOrganization = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationMutations.updateOrganization,
    onSuccess: (data, variables) => {

      // Invalidate organizations list to refresh
      queryUtils.invalidateOrganizationsList(queryClient);
      config?.onSuccess?.(data);
    },
    onError: config?.onError,
  });
};

