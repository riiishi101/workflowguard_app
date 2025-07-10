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

# Health check before starting
echo "🏥 Running health check..."
timeout 30 sh -c 'until curl -f http://localhost:3000/health; do sleep 1; done' || {
  echo "❌ Health check failed"
  exit 1
}

echo "✅ All systems ready! Starting application..."
npm run start:prod 