export { apiClient } from './client';
export { API_ENDPOINTS } from './endpoints';
export { queryKeys } from './query-keys';
export { todoQueries } from './queries';
export { todoMutations } from './mutations';

// Provider exports
export { SharedQueryProvider } from '../providers/query-provider';

// Hooks exports
export {
  useTodos,
  useTodo,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
} from '../hooks/use-todos';
export { useAuth } from '../hooks/use-auth';


// Utils exports
export { queryUtils } from '../utils/query-utils';
export { handleApiError, ApiError } from '../utils/error-handler';

// Types exports
export type {
  Todo,
  CreateTodoRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types/api-responses';
export type { QueryConfig as QueryConfigType } from '../types/query-types';