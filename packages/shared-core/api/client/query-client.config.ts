import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
        retry: 3,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}