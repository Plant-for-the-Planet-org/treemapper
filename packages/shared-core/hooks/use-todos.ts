import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoQueries } from '../api/queries';
import { todoMutations } from '../api/mutations';
import { queryKeys } from '../api/query-keys';
import { queryUtils } from '../utils/query-utils';
import { QueryConfig, MutationConfig } from '../types/query-types';

export const useTodos = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.todosList(),
    queryFn: todoQueries.getAllTodos,
    ...config,
  });
};

export const useTodo = (id: string, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.todoDetail(id),
    queryFn: () => todoQueries.getTodoById(id),
    enabled: !!id,
    ...config,
  });
};

export const useCreateTodo = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => todoMutations.createTodo(data),
    onSuccess: (data) => {
      // Invalidate and refetch todos list
      queryUtils.invalidateTodosList(queryClient);
      config?.onSuccess?.(data);
    },
    onError: config?.onError,
  });
};

export const useUpdateTodo = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoMutations.updateTodo,
    onSuccess: (data, variables) => {
      // Update the specific todo in cache
      queryClient.setQueryData(
        queryKeys.todoDetail(variables.id),
        data
      );
      // Invalidate todos list to refresh
      queryUtils.invalidateTodosList(queryClient);
      config?.onSuccess?.(data);
    },
    onError: config?.onError,
  });
};

export const useDeleteTodo = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => todoMutations.deleteTodo(id),
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.todoDetail(id) });
      // Invalidate todos list
      queryUtils.invalidateTodosList(queryClient);
      config?.onSuccess?.(data);
    },
    onError: config?.onError,
  });
};