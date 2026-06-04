import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ApiProjectContext {
  id: number;
  uid: string;
}

export const ApiProject = createParamDecorator(
  (data: keyof ApiProjectContext | undefined, ctx: ExecutionContext): ApiProjectContext | any => {
    const request = ctx.switchToHttp().getRequest();
    const apiProject = request.apiProject;
    return data ? apiProject?.[data] : apiProject;
  },
);
