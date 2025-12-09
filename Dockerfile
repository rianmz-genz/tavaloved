# -- Stage 1: Install Dependencies --
FROM node:20-alpine AS deps
WORKDIR /app

# Install library tambahan untuk kompatibilitas alpine
RUN apk add --no-cache libc6-compat

# Copy package dan install
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies DAN generate prisma client di sini
RUN npm ci
RUN npx prisma generate

# -- Stage 2: Build App --
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules yang sudah ada prisma client-nya dari stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build aplikasi
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# -- Stage 3: Runner (Production) --
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Kita pakai user bawaan 'node' (UID 1000) biar gak error permission
# Copy file public
COPY --from=builder /app/public ./public

# Copy hasil build standalone dan static assets
# Ubah kepemilikan file ke user 'node'
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Optional: Copy folder prisma (jika butuh migrate saat runtime)
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Switch ke user node
USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]