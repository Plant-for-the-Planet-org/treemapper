import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '../client/query-client.config'

const queryClient = createQueryClient()

export function SharedQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}