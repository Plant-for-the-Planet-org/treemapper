import type { ApiResponse } from '@shared-core/types/api-responses';

// The server wraps every response in this envelope (ResponseInterceptor and
// HttpExceptionFilter in apps/server/src/common). The client reads
// body.statusCode, not the HTTP status, so mocks must set it. The API mock
// sends the same value as the HTTP status.

export function ok<T>(data: T): ApiResponse<T> {
  return {
    statusCode: 200,
    message: 'Success',
    error: null,
    data,
    code: 'success',
  };
}

// Same codes as HttpExceptionFilter.getErrorCode. Pass `code` for the custom
// ones some routes send, such as `email_not_verified`.
const ERROR_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_failed',
  500: 'internal_server_error',
};

export function fail(
  statusCode: number,
  message = 'Error',
  code = ERROR_CODES[statusCode] ?? 'error'
): ApiResponse<null> {
  return { statusCode, message, error: null, data: null, code };
}

export function isEnvelope(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiResponse).statusCode === 'number' &&
    'message' in value
  );
}
