export interface ApiConfig {
    baseUrl: string;
    headers?: Record<string, string>;
  }
  
  export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;


  export interface ApiSuccessResponse<T> {
    data: T;
    success: true;
    status: number;
    error: null;
  }
  
  export interface ApiErrorResponse {
    data: null;
    success: false;
    status: number;
    error: string;
  }