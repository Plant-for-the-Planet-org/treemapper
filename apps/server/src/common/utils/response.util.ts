import { ApiResponse, SuccessResponse, ErrorResponse } from '../interfaces/response.interface';

export class ResponseUtil {
  static success<T>(
    data: T, 
    message: string = 'Success', 
    code: string = 'success'
  ): SuccessResponse<T> {
    return {
      statusCode: 200,
      message,
      error: null,
      data,
      code,
    };
  }

  static error(
    statusCode: number,
    message: string,
    error: any = null,
    code: string = 'error'
  ): ErrorResponse {
    return {
      statusCode,
      message,
      error,
      data: null,
      code,
    };
  }

  // Specific success responses
  static created<T>(data: T, message: string = 'Created successfully', code: string = 'created') {
    return this.success(data, message, code);
  }

  static updated<T>(data: T, message: string = 'Updated successfully', code: string = 'updated') {
    return this.success(data, message, code);
  }

  static deleted(message: string = 'Deleted successfully', code: string = 'deleted') {
    return this.success({ success: true }, message, code);
  }

  static fetched<T>(data: T, message: string = 'Data retrieved successfully', code: string = 'fetched') {
    return this.success(data, message, code);
  }

  // Specific error responses
  static notFound(message: string = 'Resource not found', error: any = null, code: string = 'not_found') {
    return this.error(404, message, error, code);
  }

  static badRequest(message: string = 'Bad request', error: any = null, code: string = 'bad_request') {
    return this.error(400, message, error, code);
  }

  static conflict(message: string = 'Conflict', error: any = null, code: string = 'conflict') {
    return this.error(409, message, error, code);
  }

  static unauthorized(message: string = 'Unauthorized', error: any = null, code: string = 'unauthorized') {
    return this.error(401, message, error, code);
  }

  static forbidden(message: string = 'Forbidden', error: any = null, code: string = 'forbidden') {
    return this.error(403, message, error, code);
  }

  static validationFailed(errors: any[], message: string = 'Validation failed', code: string = 'validation_failed') {
    return this.error(400, message, errors, code);
  }
}