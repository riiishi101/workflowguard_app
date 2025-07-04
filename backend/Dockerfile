FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# ---- Production image ----
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client (again, for production)
RUN npx prisma generate

# Run migrations before starting the app
RUN npx prisma migrate deploy

EXPOSE 4000

CMD ["npm", "run", "start:prod"] 