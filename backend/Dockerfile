FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Install curl for health checks
RUN apk add --no-cache curl

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Diagnostic: list source files before build
RUN ls -l /app
RUN ls -l /app/src

# Build the NestJS app
RUN npm run build

# Diagnostic: list build output
RUN ls -l /app/dist

# ---- Production image ----
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks in the production image
RUN apk add --no-cache curl

COPY package*.json ./
COPY prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Generate Prisma client (again, for production)
RUN npx prisma generate

COPY entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 3000

CMD ["npm", "run", "start:prod"] 