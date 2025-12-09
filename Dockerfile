# -- Stage 1: Install Dependencies --
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# -- Stage 2: Build App --
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Client dengan dummy URL (wajib buat build)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/mydb" npx prisma generate

RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# -- Stage 3: Runner (Production) --
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public
COPY --from=builder /app/public ./public

# Copy hasil build standalone
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Copy prisma schema & migrations (WAJIB ADA buat migrate deploy)
COPY --from=builder --chown=node:node /app/prisma ./prisma

# --- BAGIAN BARU: SETUP START.SH ---

# 1. Copy script start.sh ke dalam container
COPY --chown=node:node start.sh ./start.sh

# 2. Beri hak akses execute (biar bisa dijalankan)
RUN chmod +x ./start.sh

# Switch ke user non-root
USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ganti CMD jadi jalanin script start.sh
CMD ["./start.sh"]