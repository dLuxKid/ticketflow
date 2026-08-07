# Backend runtime image. Single-stage: this app has no build step (plain Node/Express),
# so there's nothing a multi-stage build would buy beyond a slightly smaller layer.
FROM node:22-alpine

WORKDIR /app

# Copy manifests first so `npm ci` is cached and skipped on rebuilds that only change
# application code.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# config.env (secrets) is intentionally NOT baked into the image - see .dockerignore.
# Provide runtime config via docker-compose's env_file/environment instead.

EXPOSE 4000
CMD ["node", "server.js"]
