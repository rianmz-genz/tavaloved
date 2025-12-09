#!/bin/sh

# Stop script kalau ada error
set -e

echo "🚀 Starting deployment script..."

# 1. Migrate Database
# Pastikan DATABASE_URL sudah tersedia di environment variable
echo "Running migrations..."
npx prisma migrate deploy

# 2. Seeding (Opsional)
# Kalau mau seed, uncomment baris bawah ini:
# echo "Running seeding..."
# npx prisma db seed

# 3. Start Next.js Standalone
echo "Starting Next.js Standalone..."
node server.js