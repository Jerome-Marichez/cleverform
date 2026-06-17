# Image Docker portable : vérifie que l'app build & run hors écosystème Vercel
# (anti vendor lock-in). Build "standalone" Next.js, image finale minimale.

# 1. Dépendances
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
ENV DOCKER_BUILD=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` exécute `prisma generate && next build` (voir package.json).
RUN npm run build

# 3. Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
