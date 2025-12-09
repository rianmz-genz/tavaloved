# -- Stage 1: Install Dependencies --
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# Copy prisma schema buat install deps
COPY prisma ./prisma

# Install dependencies saja
RUN npm ci

# -- Stage 2: Build App --
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules dari stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# GENERATE PRISMA DISINI (Tepat sebelum build)
# Ini memastikan client digenerate di environment yang benar dan file-nya fresh
RUN DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public" npx prisma generate

# Baru build
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# -- Stage 3: Runner (Production) --
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public
COPY --from=builder /app/public ./public

# Copy hasil build
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Optional: Copy prisma schema & migrations folder (penting kalau mau migrate di prod)
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]