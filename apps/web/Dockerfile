FROM node:23-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy web app
COPY apps/web ./apps/web

# Copy shared packages that web depends on
COPY packages ./packages

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the web app
WORKDIR /app/apps/web
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]