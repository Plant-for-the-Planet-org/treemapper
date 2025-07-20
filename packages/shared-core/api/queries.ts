import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { Todo, ApiResponse, PaginatedResponse } from '../types/api-responses';

export const todoQueries = {
  getAllTodos: async (): Promise<ApiResponse<Todo[]>> => {
    return apiClient.get<ApiResponse<Todo[]>>(API_ENDPOINTS.TODOS);
  },

  getTodoById: async (id: string): Promise<ApiResponse<Todo>> => {
    return apiClient.get<ApiResponse<Todo>>(API_ENDPOINTS.TODO_BY_ID(id));
  },
};