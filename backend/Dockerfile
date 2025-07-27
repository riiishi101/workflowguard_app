# ========================================
# WorkflowGuard Backend - Production Dockerfile
# ========================================

# Use Node.js 20 Alpine for smaller image size and security
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory and set ownership
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# ========================================
# Dependencies Stage
# ========================================
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && npm cache clean --force

# ========================================
# Build Stage
# ========================================
FROM base AS builder

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ========================================
# Production Stage
# ========================================
FROM base AS production

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Copy static files
COPY --chown=nestjs:nodejs public ./public

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /app/healthcheck.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]

# ========================================
# Development Stage (Optional)
# ========================================
FROM base AS development

# Install development dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "start:dev"]

# ========================================
# Labels for better maintainability
# ========================================
LABEL maintainer="WorkflowGuard Team"
LABEL version="1.0.0"
LABEL description="WorkflowGuard Backend API"
LABEL org.opencontainers.image.source="https://github.com/your-org/workflowguard"
LABEL org.opencontainers.image.licenses="MIT" 