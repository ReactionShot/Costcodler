# Multi-stage build for production-ready image
FROM node:20-alpine AS builder

# Set working directory
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

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S costcodle -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/web ./web

# Create data directory for SQLite database
RUN mkdir -p /data && chown -R costcodle:nodejs /data

# Change ownership of app directory
RUN chown -R costcodle:nodejs /usr/src/app

# Switch to non-root user
USER costcodle

# Set environment and expose port
ENV NODE_ENV=production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Run the built JavaScript server
CMD ["node", "dist/bot/server.js"] 