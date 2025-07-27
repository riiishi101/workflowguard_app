# ========================================
# WorkflowGuard Frontend - Production Dockerfile
# ========================================

# ========================================
# Build Stage
# ========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ========================================
# Production Stage
# ========================================
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create nginx user if it doesn't exist
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost/health || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ========================================
# Development Stage (Optional)
# ========================================
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ========================================
# Labels for better maintainability
# ========================================
LABEL maintainer="WorkflowGuard Team"
LABEL version="1.0.0"
LABEL description="WorkflowGuard Frontend Application"
LABEL org.opencontainers.image.source="https://github.com/your-org/workflowguard"
LABEL org.opencontainers.image.licenses="MIT" 