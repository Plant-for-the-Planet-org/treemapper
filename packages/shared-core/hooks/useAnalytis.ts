import { useQuery } from '@tanstack/react-query';
import { analyticsQueries } from '../api/queries';
import { queryKeys } from '../api/query-keys';
import { QueryConfig } from '../types/api-responses';

export const useDashboardKpis = (
  projectId: string,
  startDate: string,
  endDate: string,
  config?: QueryConfig
) => {
  return useQuery({
    queryKey: queryKeys.analyticsKpis(projectId, startDate, endDate),
    queryFn: () => analyticsQueries.getDashboardKpis(projectId, startDate, endDate),
    select: (data) => data.data,
    enabled: !!projectId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...config,
  });
};

export const useProjectMapData = (projectId: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.analyticsMapData(projectId),
    queryFn: () => analyticsQueries.getProjectMapData(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...config,
  });
};

export const useOverviewGraph = (
  projectId: string,
  interval: string,
  config?: QueryConfig
) => {
  return useQuery({
    queryKey: queryKeys.analyticsOverviewGraph(projectId, interval),
    queryFn: () => analyticsQueries.getOverviewGraph(projectId, interval),
    select: (data) => data.data,
    enabled: !!projectId && !!interval,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...config,
  });
};

export const useRecentAdditions = (
  projectId: string,
  page: number = 1,
  limit: number = 10,
  config?: QueryConfig
) => {
  return useQuery({
    queryKey: queryKeys.analyticsRecentAdditions(projectId, page, limit),
    queryFn: () => analyticsQueries.getRecentAdditions(projectId, page, limit),
    select: (data) => data.data,
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...config,
  });
};