import {
 ExceptionFilter,
 Catch,
 ArgumentsHost,
 HttpException,
 HttpStatus,
 Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ErrorResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
 private readonly logger = new Logger(HttpExceptionFilter.name);

 catch(exception: HttpException, host: ArgumentsHost) {
   const ctx = host.switchToHttp();
   const response = ctx.getResponse<FastifyReply>();
   const request = ctx.getRequest<FastifyRequest>();
   const status = exception.getStatus();
   const exceptionResponse = exception.getResponse();

   // Extract error details
   let message = exception.message;
   let error = null;
   let code = this.getErrorCode(status);

   if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
     const responseObj = exceptionResponse as any;
     message = responseObj.message || message;
     error = responseObj.errors || responseObj.error || null;
     code = responseObj.code || code;
   }

   const errorResponse: ErrorResponse = {
     statusCode: status,
     message,
     error,
     data: null,
     code,
   };

   // Log error for server errors
   if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
     this.logger.error(
       `${request.method} ${request.url} - ${status} - ${message}`,
       exception.stack,
       'HttpExceptionFilter',
     );
   } else {
     this.logger.warn(
       `${request.method} ${request.url} - ${status} - ${message}`,
       'HttpExceptionFilter',
     );
   }

   response.status(status).send(errorResponse);
 }

 private getErrorCode(status: number): string {
   switch (status) {
     case HttpStatus.BAD_REQUEST:
       return 'bad_request';
     case HttpStatus.UNAUTHORIZED:
       return 'unauthorized';
     case HttpStatus.FORBIDDEN:
       return 'forbidden';
     case HttpStatus.NOT_FOUND:
       return 'not_found';
     case HttpStatus.CONFLICT:
       return 'conflict';
     case HttpStatus.UNPROCESSABLE_ENTITY:
       return 'validation_failed';
     case HttpStatus.INTERNAL_SERVER_ERROR:
       return 'internal_server_error';
     default:
       return 'error';
   }
 }
}