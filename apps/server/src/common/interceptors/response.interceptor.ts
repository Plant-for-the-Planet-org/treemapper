import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the data is already in our response format, return as is
        if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
          return data;
        }

        // Otherwise, wrap in success response
        return {
          statusCode: 200,
          message: 'Success',
          error: null,
          data: data,
          code: 'success',
        };
      }),
    );
  }
}
