import { useQuery } from '@tanstack/react-query';
import { healthQueries } from '../api/queries';
import { queryKeys } from '../api/query-keys';
import { QueryConfig } from '../types/api-responses';

export const useHealthCheck = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthQueries.check,
    select: (data) => data.data, // Auto-extract data from API response
    ...config,
  });
};
