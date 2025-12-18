# =====================
# Build stage (Base)
# =====================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Install semua dependencies (termasuk devDependencies kayak prisma cli)
RUN npm ci

COPY . .

# Build Next.js
ENV NODE_ENV=production
RUN npm run build

# =====================
# Runtime Stage: NEXTJS
# =====================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json /app/prisma.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && npm run start"]


# =====================
# Runtime Stage: STUDIO (Baru!)
# =====================
FROM node:22-alpine AS studio

WORKDIR /app

# Kita copy node_modules dari builder (yang isinya lengkap)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy file Prisma & Config yang dibutuhkan
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/generated ./generated


EXPOSE 5555

# Jalankan Prisma Studio
# Hostname 0.0.0.0 wajib biar bisa diakses dari luar container
CMD ["npx", "prisma", "studio", "--port", "5555", "--browser", "none"]