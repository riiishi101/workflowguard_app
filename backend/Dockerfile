FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

COPY . .
# Generate Prisma client and build
RUN rm -rf node_modules/.prisma && npx prisma generate
RUN npm run build
# Verify build output exists
RUN ls -la dist/main.js || exit 1

# Generate production prisma client
RUN cd dist && npx prisma generate

# Start a new stage for production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy build artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["npm", "run", "start:prod"]