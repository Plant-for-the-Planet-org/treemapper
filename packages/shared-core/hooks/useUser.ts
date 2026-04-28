import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userQueries } from '../api/queries';
import { userMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { QueryConfig, MutationConfig, UpdateUserRequest, PreSignUrlRequest } from '../types/api-responses';

export const useUserMe = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.userMe(),
    queryFn: userQueries.getMe,
    select: (data) => data.data,
    ...config,
  });
};

export const useUpdateUser = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userMutations.updateDetails(data),
    onSuccess: (data, variables) => {
      // Update user cache optimistically
      queryClient.setQueryData(queryKeys.userMe(), data);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useGeneratePreSignUrl = (config?: MutationConfig) => {
  return useMutation({
    mutationFn: (data: PreSignUrlRequest) => userMutations.generatePreSignUrl(data),
    onSuccess: config?.onSuccess,
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useUpdateUserMigrated = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => userMutations.updateMigrated(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateUserMe(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};