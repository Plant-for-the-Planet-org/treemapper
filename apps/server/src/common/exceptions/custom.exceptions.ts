import { NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";

export class CustomNotFoundException extends NotFoundException {
  constructor(message: string, error: any = null, code: string = 'not_found') {
    super({
      message,
      error,
      code,
    });
  }
}

export class CustomConflictException extends ConflictException {
  constructor(message: string, error: any = null, code: string = 'conflict') {
    super({
      message,
      error,
      code,
    });
  }
}

export class CustomBadRequestException extends BadRequestException {
  constructor(message: string, error: any = null, code: string = 'bad_request') {
    super({
      message,
      error,
      code,
    });
  }
}
