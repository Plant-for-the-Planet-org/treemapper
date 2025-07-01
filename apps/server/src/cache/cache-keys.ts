export const CACHE_KEYS = {
  USER: {
    BY_AUTH0_ID: (auth0Id: string) => `user:auth0:${auth0Id}`,
    BY_EMAIL: (email: string) => `user:email:${email}`,
    BY_ID: (id: number) => `user:id:${id}`,
    BY_UID: (uid: string) => `user:uid:${uid}`,
    PROFILE: (userId: number) => `user:profile:${userId}`,
  },
  AUTH: {
    JWT_BLACKLIST: (jti: string) => `auth:blacklist:${jti}`,
    RATE_LIMIT: (identifier: string) => `auth:rate_limit:${identifier}`,
  },
  SESSION: {
    USER: (userId: number) => `session:user:${userId}`,
  }
} as const;

export const CACHE_TTL = {
  SHORT: 1200000,      // 5 minutes
  MEDIUM: 1500000,     // 15 minutes  
  LONG: 600000000,      // 1 hour
  VERY_LONG: 2400000000 // 24 hours
} as const;