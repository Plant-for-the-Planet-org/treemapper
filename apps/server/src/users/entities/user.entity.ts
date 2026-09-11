import { user } from '../../database/schema';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// For responses that exclude sensitive data
export type PublicUser = Omit<User, 'auth0Id' | 'supportPin' | 'deletedAt' | 'id' |'lastLoginAt' | 'createdAt' | 'updatedAt' | 'impersonate'>;

export type ExtendedUser = User & {
  impersonated?: boolean;
  v3Approved?: boolean
};

// Auth0 IDs written by the migration are placeholders (`email:<email>`), not real
// Auth0 subs -- the migration runs before the user has ever logged in. The first
// login claims the row and swaps in the real sub. See `linkAuth0IdByEmail`.
export const MIGRATION_AUTH0_ID_PREFIX = 'email:';

export const migrationPlaceholderAuth0Id = (email: string): string =>
  `${MIGRATION_AUTH0_ID_PREFIX}${email}`;

export const isMigrationPlaceholderAuth0Id = (auth0Id: string): boolean =>
  auth0Id.startsWith(MIGRATION_AUTH0_ID_PREFIX);

// Outcome of attaching the Auth0 sub of the current login to the row that owns
// this email address.
//
// One person can hold several Auth0 identities for the same address: an
// email/password account (`auth0|...`) plus Google, Facebook or Apple, each with
// its own sub. They are all the same human, so they all resolve to one row. The
// row stores whichever sub signed in last, and the user cache is keyed on it.
export type LinkAuth0Result =
  // The row now carries `newAuth0Id`. `previousAuth0Id` is the sub it replaced,
  // or null when the row already carried this one.
  | { status: 'linked'; user: User; previousAuth0Id: string | null }
  // No row holds this email -- the caller should create a fresh user.
  | { status: 'not_found' };