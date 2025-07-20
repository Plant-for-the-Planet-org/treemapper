export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  refetchOnWindowFocus?: boolean;
}

export interface MutationConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}