import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';

export const queryUtils = {
  invalidateTodos: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.todos });
  },

  invalidateTodosList: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.todosList() });
  },

  invalidateTodoDetail: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.todoDetail(id) });
  },

  prefetchTodos: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.todosList(),
      queryFn: () => import('../api/queries').then(m => m.todoQueries.getAllTodos()),
    });
  },
};