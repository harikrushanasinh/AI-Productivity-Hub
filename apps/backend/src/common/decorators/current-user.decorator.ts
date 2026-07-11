import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Usage: @CurrentUser() user: AuthenticatedUser
 * Pulls the authenticated user (attached by JwtStrategy) off the request.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
