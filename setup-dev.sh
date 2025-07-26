#!/bin/bash

echo "🚀 Setting up WorkflowGuard Development Environment"
echo "=================================================="

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
    echo "⚠️  Please update backend/.env with your database and HubSpot credentials"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cp frontend/env.example frontend/.env
    echo "⚠️  Please update frontend/.env with your API URL and HubSpot client ID"
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Check if database is configured
echo "🔍 Checking database configuration..."
cd ../backend
if grep -q "postgresql://username:password" .env; then
    echo "⚠️  Database URL not configured. Please update backend/.env"
    echo "   Example: DATABASE_URL=\"postgresql://user:pass@localhost:5432/workflowguard\""
fi

# Check if HubSpot is configured
if grep -q "your-hubspot-client-id" .env; then
    echo "⚠️  HubSpot not configured. Please update backend/.env and frontend/.env"
    echo "   Get credentials from: https://developers.hubspot.com/"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database and HubSpot credentials"
echo "2. Update frontend/.env with your API URL"
echo "3. Run: cd backend && npm run start:dev"
echo "4. Run: cd frontend && npm run dev"
echo ""
echo "🌐 App will be available at: http://localhost:3000"
echo "🔧 API will be available at: http://localhost:3001" 