import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { migrationQueries } from '../api/queries';
import { migrationMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { QueryConfig, MutationConfig, StartMigrationRequest } from '../types/api-responses';

export const useMigrationCheck = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.migrationCheck(),
    queryFn: migrationQueries.check,
    select: (data) => data.data,
    ...config,
  });
};

export const useMigrationStatus = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.migrationStatus(),
    queryFn: migrationQueries.getStatus,
    select: (data) => data.data,
    refetchInterval: (data) => {
      // Poll every 5 seconds if migration is in progress
      return data?.status === 'in_progress' ? 5000 : false;
    },
    ...config,
  });
};

export const useStartMigration = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartMigrationRequest) => migrationMutations.start(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMigration(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};
