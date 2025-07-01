export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  uid?: string; // Unique identifier for key generation
}

export interface CacheHealthStatus {
  status: 'healthy' | 'unhealthy';
  message: string;
  latency?: number;
  memory?: {
    used: string;
    peak: string;
    fragmentation: string;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}
