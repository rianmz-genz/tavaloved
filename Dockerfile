# -- Stage 1: Dependency Installation --
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies needed for alpine to run certain node modules (optional but recommended)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies and generate Prisma Client immediately
RUN npm ci
RUN npx prisma generate

# -- Stage 2: Build Application --
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps (now contains Prisma Client)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# -- Stage 3: Production Runner --
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 nodejs
RUN adduser -u 1001 nextjs

# Copy necessary files only
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optional: Copy prisma schema if you need to run migrations at runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use node server.js for standalone output (Much lighter and faster)
CMD ["node", "server.js"]