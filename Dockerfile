# Use Node.js 23 alpine
FROM node:22-alpine AS base

# Install system dependencies once
RUN apk add --no-cache libc6-compat

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

# Install dependencies with optimizations
RUN yarn install --frozen-lockfile --network-timeout 1000000

# Build stage
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (excluding mobile)
COPY . .
RUN rm -rf apps/mobile

# Build with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Accept build arguments for Next.js public environment variables
# These must be available at build time to be inlined into the client bundle
# Heroku config vars are available as environment variables during build
# For local builds, these can be passed via --build-arg
ARG NEXT_PUBLIC_CDN
ARG NEXT_PUBLIC_CDN_BASE
ARG NEXT_PUBLIC_MODE
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID

# Set Next.js public environment variables for build-time inlining
# These will be inlined into the client bundle during next build
# Using ARG allows Heroku config vars (available as env vars) to be passed
ENV NEXT_PUBLIC_CDN=${NEXT_PUBLIC_CDN}
ENV NEXT_PUBLIC_CDN_BASE=${NEXT_PUBLIC_CDN_BASE}
ENV NEXT_PUBLIC_MODE=${NEXT_PUBLIC_MODE}
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_AUTH0_CLIENT_ID=${NEXT_PUBLIC_AUTH0_CLIENT_ID}

# Build shared-core first, then web and server in parallel
RUN yarn turbo build --filter=shared-core...
RUN yarn turbo build --filter=web --filter=server --parallel

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
# PORT will be provided by Heroku at runtime
ENV SERVER_PORT=3001

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production files (only what's needed)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/

COPY --from=builder --chown=nextjs:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/server/package.json ./apps/server/

COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

# Expose port 3000 for general Docker usage
# Note: Heroku ignores this and uses PORT environment variable instead
EXPOSE 3000

CMD ["yarn", "start"]