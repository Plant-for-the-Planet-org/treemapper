# Use Node.js 23 alpine
FROM node:23-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY turbo.json ./

# Copy all package.json files for workspace resolution
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/shared-core/package.json ./packages/shared-core/

# Install all dependencies (including concurrently)
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (excluding mobile)
COPY . .
RUN rm -rf apps/mobile

# Build shared-core first, then web and server
RUN yarn turbo build --filter=shared-core...
RUN yarn turbo build --filter=web --filter=server

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# PORT will be provided by Heroku at runtime
ENV SERVER_PORT=3001

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/

COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# REMOVED: RUN yarn add concurrently --production
# concurrently is already installed from the deps stage

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port 3000 for general Docker usage
# Note: Heroku ignores this and uses PORT environment variable instead
EXPOSE 3000

CMD ["yarn", "start"]