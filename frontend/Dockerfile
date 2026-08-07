# Frontend runtime image (Next.js). Three stages: install deps once, build, then run -
# so a rebuild after an app-code-only change doesn't reinstall dependencies.
#
# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time, not read at
# runtime, so NEXT_PUBLIC_BASE_URL must be supplied as a build arg (see docker-compose.yml),
# not just a runtime environment variable.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
