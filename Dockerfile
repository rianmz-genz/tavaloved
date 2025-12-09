# -- Stage 1: Dependency Installation --
FROM node:20-alpine AS deps

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package.json package-lock.json ./

# Pasang dependency
RUN npm install --frozen-lockfile

# -- Stage 2: Build Aplikasi Next.js --
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Konfigurasi variabel lingkungan selama proses build (jika ada)
# ENV NEXT_PUBLIC_...

# Jalankan proses build Next.js
# NEXT_TELEMETRY_DISABLED=1 hanya untuk mematikan notifikasi telemetry saat build
RUN NEXT_TELEMETRY_DISABLED=1 npx prisma generate
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# -- Stage 3: Produksi (Running the Application) --
FROM node:20-alpine AS runner

WORKDIR /app

# Salin hanya yang diperlukan dari tahap build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# User non-root (lebih aman)
RUN addgroup -g 1001 nodejs
RUN adduser -u 1001 appuser
USER appuser

# PENTING: Environment Variables saat Runtime
ENV NODE_ENV=production
# Pastikan NEXTAUTH_SECRET dan DATABASE_URL di set di docker-compose/runtime
# ENV NEXTAUTH_SECRET="GANTI_SAYA" 
# ENV DATABASE_URL="postgresql://bookloan_user:bookloan_pass@db:5432/bookloan_db"

EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]