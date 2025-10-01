import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthTokenManager } from '../utils/auth';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<{ user: User | null; isAuthenticated: boolean }> => {
      const token = AuthTokenManager.getToken();
      if (!token) {
        return { user: null, isAuthenticated: false };
      }

      try {
        // Verify token with your API
        // const response = await apiClient.get<ApiResponse<User>>('/auth/me');
        // return { user: response.data, isAuthenticated: true };
        
        // For now, return mock data
        return { 
          user: { 
            id: '1', 
            email: 'user@example.com', 
            name: 'Test User' 
          }, 
          isAuthenticated: true 
        };
      } catch {
        AuthTokenManager.removeToken();
        return { user: null, isAuthenticated: false };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<AuthResponse> => {
      // Replace with your actual login API call
      throw new Error('Login API not implemented');
    },
    onSuccess: (data) => {
      AuthTokenManager.setToken(data.token);
      queryClient.setQueryData(['auth', 'user'], {
        user: data.user,
        isAuthenticated: true,
      });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      AuthTokenManager.removeToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], {
        user: null,
        isAuthenticated: false,
      });
      // Clear all cached data
      queryClient.clear();
    },
  });
};
