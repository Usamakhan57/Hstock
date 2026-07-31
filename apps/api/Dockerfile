# ApnaStore API — production image
FROM node:20-alpine AS base
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

RUN mkdir -p logs/app logs/error logs/http \
  uploads/products uploads/avatars uploads/documents uploads/temp \
  && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
