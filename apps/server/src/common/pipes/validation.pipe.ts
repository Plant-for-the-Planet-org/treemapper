import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const errorDetails = errors.map((error) => {
          const constraints = error.constraints;
          return {
            field: error.property,
            errors: constraints ? Object.values(constraints) : [],
          };
        });
        
        throw new BadRequestException({
          message: 'Validation failed',
          error: errorDetails,
          code: 'validation_failed',
        });
      },
    });
  }
}