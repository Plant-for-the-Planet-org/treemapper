export interface ApiConfig {
    baseUrl: string;
    headers?: Record<string, string>;
  }
  
  export interface ApiResponse<T> {
    data: T;
    status: number;
  }
  