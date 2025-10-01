import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationQueries } from '../api/queries';
import { notificationMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { QueryConfig, MutationConfig } from '../types/api-responses';

export const useMyNotifications = (
  page: number = 1,
  limit: number = 20,
  config?: QueryConfig & { enablePolling?: boolean }
) => {
  const { enablePolling = true, ...queryConfig } = config || {};

  return useQuery({
    queryKey: queryKeys.myNotifications(page, limit),
    queryFn: () => notificationQueries.getMyNotifications(page, limit),
    select: (data) => data.data,
    refetchInterval: enablePolling ? 10000 : false, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider stale for real-time updates
    ...queryConfig,
  });
};

export const useMarkAllNotificationsRead = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationMutations.markAllRead(),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMyNotifications(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

// Custom hook to get unread notification count
export const useUnreadNotificationCount = () => {
  const { data } = useMyNotifications(1, 100, {
    select: (data) => {
      const notifications = data?.notifications || [];
      return notifications.filter(n => !n.isRead).length;
    },
  });

  return data || 0;
};