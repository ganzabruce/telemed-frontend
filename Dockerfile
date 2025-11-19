# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

LABEL andasy_launch_runtime="Vite"

# Vite app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=10.14.0
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build application
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod


# Final stage for app image
FROM nginx

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx configuration for SPA routing from build context
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Verify index.html exists
RUN test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Test nginx configuration
RUN nginx -t

# Start the server by default, this can be overwritten at runtime
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]
