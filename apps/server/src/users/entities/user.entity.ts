import { users } from '../../database/schema';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// For responses that exclude sensitive data
export type PublicUser = Omit<User, 'auth0Id' | 'supportPin' | 'deletedAt' | 'id' |'lastLoginAt' | 'createdAt' | 'updatedAt'>;