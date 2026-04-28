import { applyDecorators } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

export function ApiSuccessResponse(options: {
  description: string;
  code?: string;
  example?: any;
}) {
  const exampleResponse = {
    statusCode: 200,
    message: options.description,
    error: null,
    data: options.example || {},
    code: options.code || 'success',
  };

  return applyDecorators(
    SwaggerApiResponse({
      status: 200,
      description: options.description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: options.description },
          error: { type: 'null', example: null },
          data: { type: 'object' },
          code: { type: 'string', example: options.code || 'success' },
        },
        example: exampleResponse,
      },
    }),
  );
}

export function ApiErrorResponse(options: {
  status: number;
  description: string;
  code?: string;
  errorExample?: any;
}) {
  const exampleResponse = {
    statusCode: options.status,
    message: options.description,
    error: options.errorExample || null,
    data: null,
    code: options.code || 'error',
  };

  return applyDecorators(
    SwaggerApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: options.status },
          message: { type: 'string', example: options.description },
          error: { type: 'object' },
          data: { type: 'null', example: null },
          code: { type: 'string', example: options.code || 'error' },
        },
        example: exampleResponse,
      },
    }),
  );
}