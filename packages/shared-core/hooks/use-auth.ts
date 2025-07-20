import { useQuery } from '@tanstack/react-query';

export const useAuth = () => {
  // Placeholder for auth logic
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => Promise.resolve({ user: null, isAuthenticated: false }),
    staleTime: Infinity,
  });
};
