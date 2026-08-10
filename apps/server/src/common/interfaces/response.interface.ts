export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  error: any;
  data: T;
  code: string;
}

export interface SuccessResponse<T = any> extends ApiResponse<T> {
  statusCode: 200;
  error: null;
}

export interface ErrorResponse extends ApiResponse<null> {
  statusCode: number; // any error code except 200
  data: null;
}
