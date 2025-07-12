FROM node:18-alpine
WORKDIR /usr/src/app

# Copy package files first for cache-friendly layer
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies for TypeScript build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY web/ ./web/

# Build TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm ci --omit=dev

# Set environment and expose port
ENV NODE_ENV=production
EXPOSE 3000

# Run the built JavaScript server
CMD ["node", "dist/bot/server.js"] 