FROM node:18-alpine
WORKDIR /usr/src/app

# Copy package files first for cache‑friendly layer
COPY package*.json ./
RUN npm ci --omit=dev

# Everything else
COPY bot/ ./bot
COPY web/ ./web

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "bot/server.js"] 