import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Usage: @Public() on a route to bypass the global JWT guard (e.g. login, register). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
