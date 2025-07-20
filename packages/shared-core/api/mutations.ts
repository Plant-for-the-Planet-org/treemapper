import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { Todo, CreateTodoRequest, ApiResponse } from '../types/api-responses';

export const todoMutations = {
  createTodo: async (data: CreateTodoRequest): Promise<ApiResponse<Todo>> => {
    return apiClient.post<ApiResponse<Todo>>(API_ENDPOINTS.TODOS, data);
  },

  updateTodo: async ({ id, ...data }: Partial<Todo> & { id: string }): Promise<ApiResponse<Todo>> => {
    return apiClient.put<ApiResponse<Todo>>(API_ENDPOINTS.TODO_BY_ID(id), data);
  },

  deleteTodo: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TODO_BY_ID(id));
  },
};