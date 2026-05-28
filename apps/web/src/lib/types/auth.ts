export const ALLOWED_REDIRECT_ROOTS = [
  '/',
  '/project',
  '/dashboard',
  '/onboard',
  '/profile',
] as const;

type AllowedRoot = (typeof ALLOWED_REDIRECT_ROOTS)[number];

export type RedirectPath = AllowedRoot | `${AllowedRoot}/${string}`;
