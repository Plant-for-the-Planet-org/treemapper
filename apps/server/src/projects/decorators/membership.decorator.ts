import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Membership = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.membership;
  },
);