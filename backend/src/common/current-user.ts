import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Role = 'CUSTOMER' | 'STAFF';
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
