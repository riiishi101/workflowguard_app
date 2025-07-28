#!/bin/sh
set -e

echo "🚀 Starting WorkflowGuard Backend..."

# Wait for database to be ready
echo "📊 Checking database connectivity..."
until npx prisma db push --accept-data-loss; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Removed pre-start health check here

echo "✅ All systems ready! Starting application..."
npm run start:prod 