export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return new ApiError(
      error.response.data?.message || 'An error occurred',
      error.response.status,
      error.response.data
    );
  } else if (error.request) {
    // Network error
    return new ApiError('Network error. Please check your connection.', 0);
  } else {
    // Other error
    return new ApiError(error.message || 'An unexpected error occurred', 0);
  }
};
