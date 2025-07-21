import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteQueries } from '../api/queries';
import { inviteMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { 
  QueryConfig, 
  MutationConfig, 
  CreateInviteRequest, 
  CreateInviteLinkRequest,
  AcceptInviteRequest 
} from '../types/api-responses';

export const useInviteStatus = (uuid: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.inviteStatus(uuid),
    queryFn: () => inviteQueries.getInviteStatus(uuid),
    select: (data) => data.data,
    enabled: !!uuid,
    ...config,
  });
};

export const useLinkInviteStatus = (uuid: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.inviteStatus(uuid),
    queryFn: () => inviteQueries.getLinkInviteStatus(uuid),
    select: (data) => data.data,
    enabled: !!uuid,
    ...config,
  });
};

export const useCreateProjectInvite = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteRequest & { projectId: string }) => 
      inviteMutations.createInvite(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInvites(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useCreateProjectInviteLink = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteLinkRequest & { projectId: string }) => 
      inviteMutations.createInviteLink(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInviteLinks(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useAcceptInvite = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcceptInviteRequest) => inviteMutations.acceptInvite(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMyProjects(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useAcceptLinkInvite = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcceptInviteRequest) => inviteMutations.acceptLinkInvite(data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateMyProjects(queryClient);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useDeclineInvite = (config?: MutationConfig) => {
  return useMutation({
    mutationFn: (data: AcceptInviteRequest) => inviteMutations.declineInvite(data),
    onSuccess: config?.onSuccess,
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useExpireInvite = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) => 
      inviteMutations.expireInvite(projectId, data),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInvites(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};

export const useRemoveInviteLink = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, inviteId }: { projectId: string; inviteId: string }) => 
      inviteMutations.removeInviteLink(projectId, inviteId),
    onSuccess: (data, variables) => {
      queryUtils.invalidateProjectInviteLinks(queryClient, variables.projectId);
      config?.onSuccess?.(data, variables);
    },
    onError: config?.onError,
    onSettled: config?.onSettled,
  });
};
