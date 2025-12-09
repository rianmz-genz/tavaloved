# -- Stage 3: Production Runner --
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Gak perlu bikin user baru (nextjs), kita pakai user 'node' bawaan image
# Ini jauh lebih stabil dan aman.

# Copy necessary files only
COPY --from=builder /app/public ./public

# Set ownership ke user 'node'
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Optional: Copy prisma schema
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Gunakan user 'node'
USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]